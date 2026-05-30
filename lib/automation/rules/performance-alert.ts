import { prisma } from "@/lib/prisma";
import { AutomationRule } from "@prisma/client";
import { publishEvent } from "@/lib/events/emitter";
import { isEventDuplicate } from "../deduplication";
import { AutomationExecutionContext, AutomationExecutionResult } from "../types";

/**
 * Automates academic performance monitoring and flags low achievements.
 * Alerts Parent and Class Teacher when a student's average exam marks fall below threshold.
 */
export async function processPerformanceAlertRule(
  rule: AutomationRule,
  context: AutomationExecutionContext
): Promise<AutomationExecutionResult> {
  const { schoolId } = context;
  const results: AutomationExecutionResult = {
    generatedCount: 0,
    skippedCount: 0,
    failedCount: 0,
  };

  try {
    // 1. Resolve threshold boundaries
    const config = (rule.config || {}) as Record<string, any>;
    const performanceThreshold = config.performanceThreshold ?? 40;

    // 2. Fetch active students
    const students = await prisma.student.findMany({
      where: {
        schoolId,
        isActive: true,
      },
      include: {
        parent: true,
        enrollments: {
          where: {
            status: "ACTIVE",
          },
          include: {
            batch: {
              include: {
                teacher: true,
              },
            },
          },
        },
      },
    });

    for (const student of students) {
      try {
        // Fetch all published exam marks
        const publishedResults = await prisma.result.findMany({
          where: {
            studentId: student.id,
            schoolId,
            status: "PUBLISHED",
            marks: {
              not: null,
            },
          },
          include: {
            exam: true,
          },
        });

        if (publishedResults.length === 0) {
          results.skippedCount++;
          continue;
        }

        let totalObtained = 0;
        let totalMax = 0;

        for (const res of publishedResults) {
          if (res.marks !== null && res.exam?.maxMarks) {
            totalObtained += res.marks;
            totalMax += res.exam.maxMarks;
          }
        }

        if (totalMax === 0) {
          results.skippedCount++;
          continue;
        }

        const averageMarks = (totalObtained / totalMax) * 100;

        if (averageMarks >= performanceThreshold) {
          results.skippedCount++;
          continue;
        }

        // --- Resolve Recipients ---
        const recipientUserIds = new Set<string>();

        // 1. Parent
        let parentUserId = student.parent?.userId || null;
        if (!parentUserId && student.parent?.email) {
          const matchingUser = await prisma.user.findUnique({
            where: { email: student.parent.email },
          });
          parentUserId = matchingUser?.id || null;
        }
        if (parentUserId) recipientUserIds.add(parentUserId);

        // 2. Class Teacher
        const teachers = student.enrollments
          .map((e) => e.batch.teacher)
          .filter((t): t is NonNullable<typeof t> => !!t);

        for (const teacher of teachers) {
          const teacherUser = await prisma.user.findUnique({
            where: { email: teacher.email },
            select: { id: true },
          });
          if (teacherUser) recipientUserIds.add(teacherUser.id);
        }

        if (recipientUserIds.size === 0) {
          results.skippedCount++;
          continue;
        }

        // --- Publish Alerts ---
        for (const recipientUserId of recipientUserIds) {
          try {
            const isDuplicate = await isEventDuplicate({
              schoolId,
              userId: recipientUserId,
              eventType: "LOW_PERFORMANCE_ALERT",
              entityId: student.id,
              stage: "LOW_PERFORMANCE",
            });

            if (isDuplicate) {
              results.skippedCount++;
            } else {
              await publishEvent({
                eventType: "LOW_PERFORMANCE_ALERT",
                entityType: "STUDENT",
                entityId: student.id,
                schoolId,
                payload: {
                  userId: recipientUserId,
                  schoolId,
                  studentId: student.id,
                  studentName: student.name,
                  averageMarks: Number(averageMarks.toFixed(1)),
                  stage: "LOW_PERFORMANCE",
                },
              });
              results.generatedCount++;
            }
          } catch (err) {
            console.error(`Failed to publish performance alert for student ${student.id} to recipient ${recipientUserId}:`, err);
            results.failedCount++;
          }
        }
      } catch (itemErr) {
        console.error(`Failed to evaluate academic performance for Student ${student.id}:`, itemErr);
        results.failedCount++;
      }
    }
  } catch (err) {
    console.error("Critical error in processPerformanceAlertRule handler:", err);
    throw err;
  }

  return results;
}
