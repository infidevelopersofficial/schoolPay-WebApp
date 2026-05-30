import { prisma } from "@/lib/prisma";
import { AutomationRule } from "@prisma/client";
import { publishEvent } from "@/lib/events/emitter";
import { isEventDuplicate } from "../deduplication";
import { AutomationExecutionContext, AutomationExecutionResult } from "../types";

/**
 * Evaluates upcoming exams and issues notifications to both students and parents.
 * Dynamic offset scheduling supported via config values.
 */
export async function processExamReminderRule(
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
    // 1. Fetch dynamic stages from config (Default: 7, 3, and 1 days before)
    const config = (rule.config || {}) as Record<string, any>;
    const reminderStages = config.reminderStages || [7, 3, 1];

    // 2. Fetch active exams scoped to the school
    const exams = await prisma.exam.findMany({
      where: {
        schoolId,
        date: {
          gt: new Date().toISOString().split("T")[0], // ISO date comparisons
        },
      },
      include: {
        subject: true,
        batch: {
          include: {
            enrollments: {
              where: {
                status: "ACTIVE",
              },
              include: {
                student: {
                  include: {
                    parent: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (const exam of exams) {
      try {
        const examDate = new Date(exam.date);
        const examDateStart = new Date(examDate.getFullYear(), examDate.getMonth(), examDate.getDate());

        // Calculate chronological day difference
        const diffMs = examDateStart.getTime() - todayStart.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        let stage: string | null = null;
        if (reminderStages.includes(diffDays)) {
          stage = `${diffDays}_DAYS_BEFORE`;
        }

        if (!stage) {
          results.skippedCount++;
          continue;
        }

        const enrollments = exam.batch?.enrollments || [];
        if (enrollments.length === 0) {
          results.skippedCount++;
          continue;
        }

        for (const enrollment of enrollments) {
          const student = enrollment.student;

          // Target 1: Enrolled Student In-App/Email Alerts
          if (student.userId) {
            try {
              const isDuplicate = await isEventDuplicate({
                schoolId,
                userId: student.userId,
                eventType: "EXAM_REMINDER",
                entityId: exam.id,
                stage,
              });

              if (isDuplicate) {
                results.skippedCount++;
              } else {
                await publishEvent({
                  eventType: "EXAM_REMINDER",
                  entityType: "EXAM",
                  entityId: exam.id,
                  schoolId,
                  payload: {
                    userId: student.userId,
                    schoolId,
                    studentId: student.id,
                    studentName: student.name,
                    examId: exam.id,
                    examName: exam.name,
                    examDate: exam.date,
                    subject: exam.subject.name,
                    stage,
                  },
                });
                results.generatedCount++;
              }
            } catch (err) {
              console.error(`Failed to publish exam reminder for student ${student.id}:`, err);
              results.failedCount++;
            }
          }

          // Target 2: Associated Parent Alerts
          let parentUserId = student.parent?.userId || null;
          if (!parentUserId && student.parent?.email) {
            const matchingUser = await prisma.user.findUnique({
              where: { email: student.parent.email },
            });
            parentUserId = matchingUser?.id || null;
          }

          if (parentUserId) {
            try {
              const isDuplicate = await isEventDuplicate({
                schoolId,
                userId: parentUserId,
                eventType: "EXAM_REMINDER",
                entityId: exam.id,
                stage,
              });

              if (isDuplicate) {
                results.skippedCount++;
              } else {
                await publishEvent({
                  eventType: "EXAM_REMINDER",
                  entityType: "EXAM",
                  entityId: exam.id,
                  schoolId,
                  payload: {
                    userId: parentUserId,
                    schoolId,
                    studentId: student.id,
                    studentName: student.name,
                    examId: exam.id,
                    examName: exam.name,
                    examDate: exam.date,
                    subject: exam.subject.name,
                    stage,
                  },
                });
                results.generatedCount++;
              }
            } catch (err) {
              console.error(`Failed to publish exam reminder for parent of student ${student.id}:`, err);
              results.failedCount++;
            }
          }
        }
      } catch (itemErr) {
        console.error(`Failed to evaluate exam reminder for Exam ${exam.id}:`, itemErr);
        results.failedCount++;
      }
    }
  } catch (err) {
    console.error("Critical error in processExamReminderRule handler:", err);
    throw err;
  }

  return results;
}
