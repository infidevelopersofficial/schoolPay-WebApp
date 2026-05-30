import { prisma } from "@/lib/prisma";
import { AutomationRule } from "@prisma/client";
import { publishEvent } from "@/lib/events/emitter";
import { isEventDuplicate } from "../deduplication";
import { AutomationExecutionContext, AutomationExecutionResult } from "../types";

/**
 * Automates fee overdue notifications and progressive escalation.
 * Milestones:
 * - 15 Days Overdue: Notify Parent and Class Teacher.
 * - 30 Days Overdue: Notify Parent and Principal/Admins.
 */
export async function processFeeOverdueEscalationRule(
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
    // 1. Resolve thresholds from config (Default: [15, 30] days overdue)
    const config = (rule.config || {}) as Record<string, any>;
    const escalationStages = config.escalationStages || [15, 30];

    // 2. Fetch unpaid invoices whose dueDates are in the past
    const invoices = await prisma.invoice.findMany({
      where: {
        schoolId,
        status: {
          in: ["SENT", "OVERDUE"],
        },
        dueDate: {
          lt: new Date(),
        },
      },
      include: {
        student: {
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

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (const invoice of invoices) {
      try {
        const dueDate = new Date(invoice.dueDate);
        const dueStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

        // Calculate days overdue
        const diffMs = todayStart.getTime() - dueStart.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        let stage: string | null = null;
        if (escalationStages.includes(diffDays)) {
          stage = `${diffDays}_DAYS_OVERDUE`;
        }

        if (!stage) {
          results.skippedCount++;
          continue;
        }

        const student = invoice.student;
        const isLevel30 = diffDays >= 30;

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

        // 2. Class Teacher (only for 15-day milestone)
        if (!isLevel30) {
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
        }

        // 3. Principal/Super Admin (only for 30-day milestone)
        if (isLevel30 && principalUserId) {
          recipientUserIds.add(principalUserId);
        }

        // --- Publish Escalation Alerts ---
        for (const recipientUserId of recipientUserIds) {
          try {
            const isDuplicate = await isEventDuplicate({
              schoolId,
              userId: recipientUserId,
              eventType: "FEE_OVERDUE",
              entityId: invoice.id,
              stage,
            });

            if (isDuplicate) {
              results.skippedCount++;
            } else {
              await publishEvent({
                eventType: "FEE_OVERDUE",
                entityType: "INVOICE",
                entityId: invoice.id,
                schoolId,
                payload: {
                  userId: recipientUserId,
                  schoolId,
                  studentName: student.name,
                  invoiceNo: invoice.invoiceNo,
                  amount: invoice.total,
                  dueDate: invoice.dueDate,
                  stage,
                },
              });
              results.generatedCount++;
            }
          } catch (err) {
            console.error(`Failed to publish overdue escalation for recipient ${recipientUserId}:`, err);
            results.failedCount++;
          }
        }
      } catch (itemErr) {
        console.error(`Failed to evaluate overdue escalation for Invoice ${invoice.id}:`, itemErr);
        results.failedCount++;
      }
    }
  } catch (err) {
    console.error("Critical error in processFeeOverdueEscalationRule handler:", err);
    throw err;
  }

  return results;
}
