import { prisma } from "@/lib/prisma"
import { getTenantContext, TenantError } from "@/lib/tenant-context"
import { withDAL } from "@/lib/dal/utils"
import { unstable_cache } from "next/cache"

const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"]

export const getRevenueForecastCached = unstable_cache(
  async (schoolId: string) => {
    const now = new Date()
    
    // We assume deterministic average monthly revenue based on active students and their active fees
    // For simplicity, we calculate a run rate. Let's find past 3 months revenue.
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
    
    const pastRevenueQuery = await prisma.payment.aggregate({
      where: { schoolId, status: "COMPLETED", date: { gte: threeMonthsAgo } },
      _sum: { amount: true }
    })
    
    const pastRevenue = pastRevenueQuery._sum.amount || 0
    const monthlyRunRate = pastRevenue / 3
    
    // Also consider unpaid invoices as short-term upside
    const pendingInvoices = await prisma.invoice.aggregate({
      where: { schoolId, status: { in: ["SENT", "OVERDUE"] } },
      _sum: { total: true }
    })
    const outstanding = pendingInvoices._sum.total || 0
    
    // Recovery multiplier (say 80% collection rate historically)
    // If not calculating dynamic rate here, we use a fixed 80%
    const collectionMultiplier = 0.8
    
    const forecast = {
      window30: Number(((monthlyRunRate * 1) + (outstanding * collectionMultiplier)).toFixed(2)),
      window90: Number(((monthlyRunRate * 3) + (outstanding * collectionMultiplier)).toFixed(2)),
      window180: Number(((monthlyRunRate * 6) + (outstanding * collectionMultiplier)).toFixed(2)),
      window365: Number(((monthlyRunRate * 12) + (outstanding * collectionMultiplier)).toFixed(2)),
    }
    
    return forecast
  },
  ["finance-revenue-forecast"],
  { revalidate: 900 }
)

export async function getRevenueForecast() {
  return withDAL("finance.forecast", async () => {
    const ctx = await getTenantContext()
    if (!ALLOWED_ROLES.includes(ctx.schoolRole || "")) throw new TenantError("Access denied")
    return getRevenueForecastCached(ctx.schoolId)
  })
}
