import { getCollectionMetricsCached } from "@/lib/dal/collection-dashboard"
import { prisma } from "@/lib/prisma"

/**
 * Invoked by the Automation Engine when rule = MONTHLY_COLLECTION_EXECUTIVE_REPORT
 */
export async function generateMonthlyCollectionReport(schoolId: string) {
  const metrics = await getCollectionMetricsCached(schoolId)
  const now = new Date()
  
  // Format data for email/notification injection
  const payload = {
    month: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
    totalBilled: metrics.totalBilled,
    totalCollected: metrics.totalCollected,
    outstanding: metrics.outstanding,
    recoveryRate: metrics.recoveryRate,
    kpiHistory: metrics.kpiHistory
  }

  return payload
}
