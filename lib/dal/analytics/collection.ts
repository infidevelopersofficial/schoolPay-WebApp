import { withTenantRead } from "@/lib/dal/core";
import { prisma } from "@/lib/prisma";
import { withDAL } from "@/lib/dal/utils";
import { getSchoolId } from "@/lib/tenant-context";
import { logger } from "@/lib/logger";
import { THRESHOLDS } from "@/lib/observability/performance";

const log = logger.child({ domain: "analytics.collection" });

export interface CollectionAnalyticsPayload {
  billedTotal: number;
  collectedTotal: number;
  recoveryRate: number;
  agingBrackets: {
    current: number;
    under_15_days: number;
    between_15_30_days: number;
    over_30_days: number;
  };
  recentPenaltiesCount: number;
  recentPenaltiesAmount: number;
}

/**
 * Computes school-specific collection metrics, aging schedules, and recovery statistics.
 * Enforces strict RLS tenant isolation boundaries.
 */
export async function getCollectionAnalytics(): Promise<CollectionAnalyticsPayload> {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId();

    return withDAL(
      "analytics.getCollectionMetrics",
      async () => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // 1. Query all active invoices (excluding Drafts)
        const invoices = await prisma.invoice.findMany({
          where: {
            schoolId,
            status: {
              not: "DRAFT",
            },
          },
        });

        // 2. Query recently applied penalties
        const penalties = await prisma.invoicePenalty.findMany({
          where: {
            schoolId,
            createdAt: {
              gte: thirtyDaysAgo,
            },
          },
        });

        const billedTotal = invoices.reduce((sum, inv) => sum + inv.total, 0);
        const collectedTotal = invoices
          .filter((inv) => inv.status === "PAID")
          .reduce((sum, inv) => sum + inv.total, 0);

        const recoveryRate = billedTotal > 0
          ? Number(((collectedTotal / billedTotal) * 100).toFixed(1))
          : 100.0;

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const agingBrackets = {
          current: 0,
          under_15_days: 0,
          between_15_30_days: 0,
          over_30_days: 0,
        };

        for (const inv of invoices) {
          if (inv.status === "PAID") {
            continue;
          }

          const dueDate = new Date(inv.dueDate);
          const dueStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

          const diffMs = todayStart.getTime() - dueStart.getTime();
          const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

          if (diffDays <= 0) {
            // Due date is in the future or today
            agingBrackets.current += inv.total;
          } else if (diffDays <= 15) {
            agingBrackets.under_15_days += inv.total;
          } else if (diffDays <= 30) {
            agingBrackets.between_15_30_days += inv.total;
          } else {
            agingBrackets.over_30_days += inv.total;
          }
        }

        const recentPenaltiesCount = penalties.length;
        const recentPenaltiesAmount = penalties.reduce((sum, p) => sum + p.amount, 0);

        return {
          billedTotal: Number(billedTotal.toFixed(2)),
          collectedTotal: Number(collectedTotal.toFixed(2)),
          recoveryRate,
          agingBrackets: {
            current: Number(agingBrackets.current.toFixed(2)),
            under_15_days: Number(agingBrackets.under_15_days.toFixed(2)),
            between_15_30_days: Number(agingBrackets.between_15_30_days.toFixed(2)),
            over_30_days: Number(agingBrackets.over_30_days.toFixed(2)),
          },
          recentPenaltiesCount,
          recentPenaltiesAmount: Number(recentPenaltiesAmount.toFixed(2)),
        };
      },
      { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY }
    );
  });
}
