import { prisma } from "@/lib/prisma";
import { AutomationRule } from "@prisma/client";
import { publishEvent } from "@/lib/events/emitter";
import { AutomationExecutionContext, AutomationExecutionResult } from "../types";

/**
 * Automates generation of monthly collection reports.
 * Compiles: Total Billed, Total Collected, Collection Rate, and Overdue Aging Brackets.
 * Notifies Principal and Administrators.
 */
export async function processCollectionReportRule(
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
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Fetch Invoices from the past 30 days (excluding drafts)
    const recentInvoices = await prisma.invoice.findMany({
      where: {
        schoolId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
        status: {
          not: "DRAFT",
        },
      },
    });

    const totalBilled = recentInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalCollected = recentInvoices
      .filter((inv) => inv.status === "PAID")
      .reduce((sum, inv) => sum + inv.total, 0);

    const collectionRate = totalBilled > 0
      ? Number(((totalCollected / totalBilled) * 100).toFixed(1))
      : 100.0;

    // 2. Fetch all overdue invoices to compile Aging Buckets
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        schoolId,
        status: {
          in: ["SENT", "OVERDUE"],
        },
        dueDate: {
          lt: new Date(),
        },
      },
    });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const agingBuckets = {
      under_15_days: 0,
      between_15_30_days: 0,
      over_30_days: 0,
    };

    for (const inv of overdueInvoices) {
      const dueDate = new Date(inv.dueDate);
      const dueStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
      
      const diffMs = todayStart.getTime() - dueStart.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays <= 15) {
        agingBuckets.under_15_days += inv.total;
      } else if (diffDays <= 30) {
        agingBuckets.between_15_30_days += inv.total;
      } else {
        agingBuckets.over_30_days += inv.total;
      }
    }

    // 3. Resolve Admin / Principal recipients
    const adminMembers = await prisma.userSchool.findMany({
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

    if (adminMembers.length === 0) {
      results.skippedCount++;
      return results;
    }

    // 4. Publish executive report DomainEvents for each administrator
    for (const admin of adminMembers) {
      try {
        await publishEvent({
          eventType: "MONTHLY_COLLECTION_REPORT",
          entityType: "SCHOOL",
          entityId: schoolId,
          schoolId,
          payload: {
            userId: admin.userId,
            schoolId,
            totalBilled,
            totalCollected,
            collectionRate,
            agingUnder15: agingBuckets.under_15_days,
            aging15to30: agingBuckets.between_15_30_days,
            agingOver30: agingBuckets.over_30_days,
          },
        });
        results.generatedCount++;
      } catch (err) {
        console.error(`Failed to publish collection report for administrator ${admin.userId}:`, err);
        results.failedCount++;
      }
    }
  } catch (err) {
    console.error("Critical error in processCollectionReportRule handler:", err);
    throw err;
  }

  return results;
}
