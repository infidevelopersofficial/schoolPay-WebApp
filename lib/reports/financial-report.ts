import { getRevenueAnalyticsCached, getExpenseAnalyticsCached, getProfitabilityAnalyticsCached } from "@/lib/finance/analytics"
import { getScholarshipAnalyticsCached } from "@/lib/finance/scholarship-analytics"
import { getRevenueForecastCached } from "@/lib/finance/revenue-forecast"
import { getCollectionMetricsCached } from "@/lib/dal/collection-dashboard"

/**
 * Generates a comprehensive financial report payload.
 * Used by the Automation Engine for MONTHLY_FINANCIAL_REPORT / QUARTERLY_FINANCIAL_REPORT rules.
 */
export async function generateFinancialReport(schoolId: string) {
  const [revenue, expense, profitability, scholarships, forecast, collection] = await Promise.all([
    getRevenueAnalyticsCached(schoolId),
    getExpenseAnalyticsCached(schoolId),
    getProfitabilityAnalyticsCached(schoolId),
    getScholarshipAnalyticsCached(schoolId),
    getRevenueForecastCached(schoolId),
    getCollectionMetricsCached(schoolId),
  ])

  const now = new Date()

  return {
    generatedAt: now.toISOString(),
    period: now.toLocaleString("default", { month: "long", year: "numeric" }),
    revenueSummary: {
      grossRevenue: revenue.grossRevenue,
      netRevenue: revenue.netRevenue,
      collectionRate: revenue.collectionRate,
    },
    expenseSummary: {
      totalExpenses: expense.totalExpenses,
      topCategories: expense.categoryBreakdown.slice(0, 5),
    },
    profitability: {
      operatingProfit: profitability.operatingProfit,
      operatingMargin: profitability.operatingMargin,
    },
    collectionMetrics: {
      totalBilled: collection.totalBilled,
      totalCollected: collection.totalCollected,
      outstanding: collection.outstanding,
      recoveryRate: collection.recoveryRate,
    },
    scholarshipMetrics: {
      totalGranted: scholarships.totalScholarshipsGranted,
      revenueForgone: scholarships.revenueForgone,
      recoveryImpact: scholarships.scholarshipRecoveryImpact,
    },
    forecast: {
      window30: forecast.window30,
      window90: forecast.window90,
      window180: forecast.window180,
      window365: forecast.window365,
    },
  }
}
