import { prisma } from "@/lib/prisma";
import { AutomationRule } from "@prisma/client";
import { publishEvent } from "@/lib/events/emitter";
import { isEventDuplicate } from "../deduplication";
import { AutomationExecutionContext, AutomationExecutionResult } from "../types";

/**
 * Automates attendance auditing and escalation alerts.
 * Identifies:
 * A) Consecutive absences (e.g. 3 consecutive days absent)
 * B) Attendance percentage drops below threshold (e.g. < 75%)
 * Escalates to Parent, Class Teacher, and Principal.
 */
export async function processAttendanceEscalationRule(
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
    // 1. Resolve configuration thresholds
    const config = (rule.config || {}) as Record<string, any>;
    const consecutiveAbsenceLimit = config.consecutiveAbsenceLimit ?? 3;
    const attendanceThreshold = config.attendanceThreshold ?? 75;

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

    // Resolve Principal/Super Admin context
    const adminMember = await prisma.userSchool.findFirst({
      where: {
        schoolId,
        role: {
          in: ["SUPER_ADMIN", "ADMIN"],
        },
      },
      select: {
        userId: true,
      },
    });
    const principalUserId = adminMember?.userId || null;

    for (const student of students) {
      try {
        let isConsecutiveBreach = false;
        let isThresholdBreach = false;
        let calculatedPercentage = 100;
        let totalAbsentCount = 0;

        // --- A. Consecutive Absence Check ---
        const recentLogs = await prisma.attendance.findMany({
          where: {
            studentId: student.id,
            schoolId,
          },
          orderBy: {
            date: "desc",
          },
          take: consecutiveAbsenceLimit,
        });

        if (recentLogs.length === consecutiveAbsenceLimit) {
          const allAbsent = recentLogs.every((log) => log.status === "ABSENT");
          if (allAbsent) {
            isConsecutiveBreach = true;
          }
        }

        // --- B. Threshold Percentage Check ---
        const allLogs = await prisma.attendance.findMany({
          where: {
            studentId: student.id,
            schoolId,
          },
        });

        if (allLogs.length > 0) {
          // Count active academic days, ignoring holidays and un-marked registers
          const activeDays = allLogs.filter(
            (l) => l.status !== "HOLIDAY" && l.status !== "NOT_MARKED"
          );

          if (activeDays.length > 0) {
            const presentDays = activeDays.filter(
              (l) => l.status === "PRESENT" || l.status === "LATE"
            ).length;
            const halfDays = activeDays.filter((l) => l.status === "HALF_DAY").length;
            const absentDays = activeDays.filter((l) => l.status === "ABSENT").length;

            totalAbsentCount = absentDays;
            
            // Mathematically precise percentage calculation
            calculatedPercentage = ((presentDays + halfDays * 0.5) / activeDays.length) * 100;

            if (calculatedPercentage < attendanceThreshold) {
              isThresholdBreach = true;
            }
          }
        }

        if (!isConsecutiveBreach && !isThresholdBreach) {
          results.skippedCount++;
          continue;
        }

        // --- Resolve Recipients ---
        const recipientUserIds = new Set<string>();

        // 1. Parent userId
        let parentUserId = student.parent?.userId || null;
        if (!parentUserId && student.parent?.email) {
          const matchingUser = await prisma.user.findUnique({
            where: { email: student.parent.email },
          });
          parentUserId = matchingUser?.id || null;
        }
        if (parentUserId) recipientUserIds.add(parentUserId);

        // 2. Class Teachers (from active student batches)
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

        // 3. Principal/School Administrator
        if (principalUserId) {
          recipientUserIds.add(principalUserId);
        }

        // --- Publish Alerts ---
        for (const recipientUserId of recipientUserIds) {
          // Send consecutive absence alert if breached
          if (isConsecutiveBreach) {
            try {
              const isDuplicate = await isEventDuplicate({
                schoolId,
                userId: recipientUserId,
                eventType: "ATTENDANCE_ESCALATION",
                entityId: student.id,
                stage: "CONSECUTIVE_ABSENCE",
              });

              if (isDuplicate) {
                results.skippedCount++;
              } else {
                await publishEvent({
                  eventType: "ATTENDANCE_ESCALATION",
                  entityType: "STUDENT",
                  entityId: student.id,
                  schoolId,
                  payload: {
                    userId: recipientUserId,
                    schoolId,
                    studentId: student.id,
                    studentName: student.name,
                    attendancePercentage: Number(calculatedPercentage.toFixed(1)),
                    absentDays: consecutiveAbsenceLimit,
                    stage: "CONSECUTIVE_ABSENCE",
                  },
                });
                results.generatedCount++;
              }
            } catch (err) {
              console.error(`Failed to publish consecutive absence alert for recipient ${recipientUserId}:`, err);
              results.failedCount++;
            }
          }

          // Send threshold breach alert if breached
          if (isThresholdBreach) {
            try {
              const isDuplicate = await isEventDuplicate({
                schoolId,
                userId: recipientUserId,
                eventType: "ATTENDANCE_ESCALATION",
                entityId: student.id,
                stage: "THRESHOLD_BREACH",
              });

              if (isDuplicate) {
                results.skippedCount++;
              } else {
                await publishEvent({
                  eventType: "ATTENDANCE_ESCALATION",
                  entityType: "STUDENT",
                  entityId: student.id,
                  schoolId,
                  payload: {
                    userId: recipientUserId,
                    schoolId,
                    studentId: student.id,
                    studentName: student.name,
                    attendancePercentage: Number(calculatedPercentage.toFixed(1)),
                    absentDays: totalAbsentCount,
                    stage: "THRESHOLD_BREACH",
                  },
                });
                results.generatedCount++;
              }
            } catch (err) {
              console.error(`Failed to publish attendance threshold breach for recipient ${recipientUserId}:`, err);
              results.failedCount++;
            }
          }
        }
      } catch (itemErr) {
        console.error(`Failed to process attendance escalation for Student ${student.id}:`, itemErr);
        results.failedCount++;
      }
    }
  } catch (err) {
    console.error("Critical error in processAttendanceEscalationRule handler:", err);
    throw err;
  }

  return results;
}
