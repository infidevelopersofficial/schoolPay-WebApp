import { prisma } from "@/lib/prisma";
import { AutomationRule } from "@prisma/client";
import { publishEvent } from "@/lib/events/emitter";
import { isEventDuplicate } from "../deduplication";
import { AutomationExecutionContext, AutomationExecutionResult } from "../types";

/**
 * Automates fee reminders for approaching invoice due dates.
 * Queries active SENT invoices and generates FEE_DUE events for 7, 3, and 1 day stages.
 */
export async function processFeeReminderRule(
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
    // 1. Fetch SENT invoices scoped to the tenant
    const invoices = await prisma.invoice.findMany({
      where: {
        schoolId,
        status: "SENT",
        dueDate: {
          gt: new Date(),
        },
      },
      include: {
        student: {
          include: {
            parent: true,
          },
        },
      },
    });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (const invoice of invoices) {
      try {
        const dueDate = new Date(invoice.dueDate);
        const dueStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

        // Calculate direct difference in days
        const diffMs = dueStart.getTime() - todayStart.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        let stage: string | null = null;
        if (diffDays === 7) stage = "7_DAYS_BEFORE";
        else if (diffDays === 3) stage = "3_DAYS_BEFORE";
        else if (diffDays === 1) stage = "1_DAY_BEFORE";

        if (!stage) {
          results.skippedCount++;
          continue;
        }

        const student = invoice.student;
        let parentUserId = student.parent?.userId || student.userId || null;

        if (!parentUserId && student.parent?.email) {
          const matchingUser = await prisma.user.findUnique({
            where: { email: student.parent.email },
          });
          parentUserId = matchingUser?.id || null;
        }

        if (!parentUserId) {
          results.failedCount++;
          continue;
        }

        // 2. Prevent duplicate notifications
        const isDuplicate = await isEventDuplicate({
          schoolId,
          userId: parentUserId,
          eventType: "FEE_DUE",
          entityId: invoice.id,
          stage,
        });

        if (isDuplicate) {
          results.skippedCount++;
          continue;
        }

        // 3. Emit DomainEvent into the outbox
        await publishEvent({
          eventType: "FEE_DUE",
          entityType: "INVOICE",
          entityId: invoice.id,
          schoolId,
          payload: {
            userId: parentUserId,
            schoolId,
            studentName: student.name,
            invoiceNo: invoice.invoiceNo,
            amount: invoice.total,
            dueDate: invoice.dueDate,
            stage,
          },
        });

        results.generatedCount++;
      } catch (itemErr) {
        console.error(`Failed to process fee reminder for invoice ${invoice.id}:`, itemErr);
        results.failedCount++;
      }
    }
  } catch (err) {
    console.error("Critical error in Fee Reminder rule handler:", err);
    throw err;
  }

  return results;
}
