import { prisma } from "@/lib/prisma";
import { AutomationRule } from "@prisma/client";
import { publishEvent } from "@/lib/events/emitter";
import { isEventDuplicate } from "../deduplication";
import { AutomationExecutionContext, AutomationExecutionResult } from "../types";

/**
 * Evaluates approaching assignment deadlines and schedules student alert events.
 * Dynamic offset configuration supported via rule config options.
 */
export async function processAssignmentReminderRule(
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
    // 1. Fetch dynamic stages from config (Default: 3 and 1 days before due date)
    const config = (rule.config || {}) as Record<string, any>;
    const reminderStages = config.reminderStages || [3, 1];

    // 2. Fetch pending assignments
    const assignments = await prisma.assignment.findMany({
      where: {
        schoolId,
        dueDate: {
          gt: new Date(),
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
                student: true,
              },
            },
          },
        },
      },
    });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (const assignment of assignments) {
      try {
        const dueDate = new Date(assignment.dueDate);
        const dueStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

        // Calculate chronological day difference
        const diffMs = dueStart.getTime() - todayStart.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        let stage: string | null = null;
        if (reminderStages.includes(diffDays)) {
          stage = `${diffDays}_DAYS_BEFORE`;
        }

        if (!stage) {
          results.skippedCount++;
          continue;
        }

        const enrollments = assignment.batch?.enrollments || [];
        if (enrollments.length === 0) {
          results.skippedCount++;
          continue;
        }

        for (const enrollment of enrollments) {
          const student = enrollment.student;

          if (student.userId) {
            try {
              const isDuplicate = await isEventDuplicate({
                schoolId,
                userId: student.userId,
                eventType: "ASSIGNMENT_REMINDER",
                entityId: assignment.id,
                stage,
              });

              if (isDuplicate) {
                results.skippedCount++;
              } else {
                await publishEvent({
                  eventType: "ASSIGNMENT_REMINDER",
                  entityType: "ASSIGNMENT",
                  entityId: assignment.id,
                  schoolId,
                  payload: {
                    userId: student.userId,
                    schoolId,
                    assignmentId: assignment.id,
                    title: assignment.title,
                    dueDate: assignment.dueDate,
                    subject: assignment.subject.name,
                    stage,
                  },
                });
                results.generatedCount++;
              }
            } catch (err) {
              console.error(`Failed to publish assignment reminder for student ${student.id}:`, err);
              results.failedCount++;
            }
          } else {
            results.skippedCount++;
          }
        }
      } catch (itemErr) {
        console.error(`Failed to evaluate assignment reminder for Assignment ${assignment.id}:`, itemErr);
        results.failedCount++;
      }
    }
  } catch (err) {
    console.error("Critical error in processAssignmentReminderRule handler:", err);
    throw err;
  }

  return results;
}
