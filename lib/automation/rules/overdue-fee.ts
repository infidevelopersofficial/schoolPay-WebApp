import { prisma } from "@/lib/prisma";
import { AutomationRule } from "@prisma/client";
import { publishEvent } from "@/lib/events/emitter";
import { isEventDuplicate } from "../deduplication";
import { AutomationExecutionContext, AutomationExecutionResult } from "../types";

/**
 * Automates reminders for overdue invoices.
 * Queries active SENT or OVERDUE invoices that have passed their dueDate and
 * generates FEE_OVERDUE events for 1, 7, 15, and 30 day overdue stages.
 */
export async function processOverdueFeeRule(
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
    // 1. Fetch unpaid invoices whose dueDates are in the past
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

        // Calculate days overdue
        const diffMs = todayStart.getTime() - dueStart.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        let stage: string | null = null;
        if (diffDays === 1) stage = "1_DAY_OVERDUE";
        else if (diffDays === 7) stage = "7_DAYS_OVERDUE";
        else if (diffDays === 15) stage = "15_DAYS_OVERDUE";
        else if (diffDays === 30) stage = "30_DAYS_OVERDUE";

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
          eventType: "FEE_OVERDUE",
          entityId: invoice.id,
          stage,
        });

        if (isDuplicate) {
          results.skippedCount++;
          continue;
        }

        // 3. Emit DomainEvent into the outbox
        await publishEvent({
          eventType: "FEE_OVERDUE",
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
        console.error(`Failed to process overdue fee reminder for invoice ${invoice.id}:`, itemErr);
        results.failedCount++;
      }
    }
  } catch (err) {
    console.error("Critical error in Overdue Fee rule handler:", err);
    throw err;
  }

  return results;
}
