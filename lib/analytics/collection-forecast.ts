import { prisma } from "@/lib/prisma"
import { getTenantContext, TenantError } from "@/lib/tenant-context"
import { withDAL } from "@/lib/dal/utils"
import { unstable_cache } from "next/cache"
import { getRecoveryAnalyticsCached } from "./recovery-analytics"

const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"]

export const generateDeterministicForecastCached = unstable_cache(
  async (schoolId: string) => {
    const now = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(now.getDate() + 30)

    // Pending invoices due within next 30 days
    const upcomingInvoices = await prisma.invoice.aggregate({
      where: {
        schoolId,
        status: { in: ["DRAFT", "SENT"] },
        dueDate: {
          gte: now,
          lte: thirtyDaysFromNow
        }
      },
      _sum: { total: true }
    })

    // Current OVERDUE invoices
    const overdueInvoices = await prisma.invoice.aggregate({
      where: {
        schoolId,
        status: "OVERDUE"
      },
      _sum: { total: true }
    })

    const upcomingAmount = upcomingInvoices._sum.total || 0
    const overdueAmount = overdueInvoices._sum.total || 0

    // Get recovery analytics to derive a baseline rate
    const recoveryData = await getRecoveryAnalyticsCached(schoolId)
    
    // Fallback to 80% if no historical data exists
    let historicalRate = 0.80
    if (recoveryData.totalStudents > 0) {
      historicalRate = (recoveryData.totalStudents - recoveryData.defaultersCount) / recoveryData.totalStudents
      // Ensure we have a sane minimum baseline for active schools
      if (historicalRate < 0.2) historicalRate = 0.2
    }
    
    // Overdue is harder to collect, assume a heavily discounted recovery probability
    const overdueRecoveryProbability = historicalRate * 0.35

    const forecastedCollection = (upcomingAmount * historicalRate) + (overdueAmount * overdueRecoveryProbability)

    return {
      forecastedCollection: Number(forecastedCollection.toFixed(2)),
      upcomingAmount,
      overdueAmount,
      historicalRate: Number((historicalRate * 100).toFixed(1)),
      expectedOverdueRecovery: Number((overdueAmount * overdueRecoveryProbability).toFixed(2))
    }
  },
  ["collection-forecast"],
  { revalidate: 900 }
)

export async function generateDeterministicForecast() {
  return withDAL("analytics.forecast", async () => {
    const ctx = await getTenantContext()
    if (!ALLOWED_ROLES.includes(ctx.schoolRole || "")) {
      throw new TenantError("Access denied: Executive Dashboard permissions required.")
    }
    return generateDeterministicForecastCached(ctx.schoolId)
  })
}
