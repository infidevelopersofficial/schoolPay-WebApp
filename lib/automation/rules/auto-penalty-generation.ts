import { prisma } from "@/lib/prisma";
import { AutomationRule } from "@prisma/client";
import { publishEvent } from "@/lib/events/emitter";
import { AutomationExecutionContext, AutomationExecutionResult } from "../types";

/**
 * Automates penalty generation and invoice late-fee application.
 * Milestones:
 * - 7 Days Overdue: Appends a late fee penalty (default ₹250) and updates invoice totals.
 */
export async function processAutoPenaltyGenerationRule(
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
    // 1. Resolve configuration settings
    const config = (rule.config || {}) as Record<string, any>;
    const graceDays = config.graceDays ?? 7;
    const penaltyAmount = config.penaltyAmount ?? 250;
    const stage = `${graceDays}_DAYS_OVERDUE_PENALTY`;

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
          },
        },
        penalties: {
          where: {
            reason: stage,
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

        // Only apply penalty if they have breached the grace window exactly today
        // (This makes the task run daily without continuously re-adding penalties)
        if (diffDays !== graceDays) {
          results.skippedCount++;
          continue;
        }

        // 3. Double penalty check to assure idempotence
        if (invoice.penalties.length > 0) {
          results.skippedCount++;
          continue;
        }

        const student = invoice.student;
        let parentUserId = student.parent?.userId || null;
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

        // 4. Update Invoice totals and insert Penalty inside a transaction
        await prisma.$transaction(async (tx) => {
          // Add late-fee line item in JSON array
          const originalLineItems = Array.isArray(invoice.lineItems)
            ? invoice.lineItems
            : [];
          
          const updatedLineItems = [
            ...originalLineItems,
            {
              description: `Late Payment Penalty - ${graceDays} Days Overdue`,
              qty: 1,
              rate: penaltyAmount,
              amount: penaltyAmount,
            },
          ];

          const updatedSubtotal = invoice.subtotal + penaltyAmount;
          const updatedTotal = invoice.total + penaltyAmount;

          // Save penalty log record
          await tx.invoicePenalty.create({
            data: {
              invoiceId: invoice.id,
              schoolId,
              amount: penaltyAmount,
              reason: stage,
            },
          });

          // Save updated invoice
          await tx.invoice.update({
            where: { id: invoice.id },
            data: {
              lineItems: updatedLineItems,
              subtotal: updatedSubtotal,
              total: updatedTotal,
              status: "OVERDUE", // Ensure status advances to OVERDUE
            },
          });

          // 5. Emit outbox event
          await publishEvent({
            eventType: "LATE_FEE_PENALTY",
            entityType: "INVOICE",
            entityId: invoice.id,
            schoolId,
            tx,
            payload: {
              userId: parentUserId,
              schoolId,
              invoiceNo: invoice.invoiceNo,
              penaltyAmount,
              totalAmount: updatedTotal,
              reason: `Late Payment Penalty - ${graceDays} Days Overdue`,
            },
          });
        });

        results.generatedCount++;
      } catch (itemErr) {
        console.error(`Failed to apply late fee penalty for Invoice ${invoice.id}:`, itemErr);
        results.failedCount++;
      }
    }
  } catch (err) {
    console.error("Critical error in processAutoPenaltyGenerationRule handler:", err);
    throw err;
  }

  return results;
}
