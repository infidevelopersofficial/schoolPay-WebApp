import { prisma } from "@/lib/prisma"
import { getTenantContext, TenantError } from "@/lib/tenant-context"
import { withDAL } from "@/lib/dal/utils"
import { unstable_cache } from "next/cache"

const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"]

export const getCollectionMetricsCached = unstable_cache(
  async (schoolId: string) => {
    const now = new Date()
    
    // 1. Overall Metrics
    const invoices = await prisma.invoice.aggregate({
      where: { schoolId, status: { notIn: ["DRAFT", "CANCELLED"] } },
      _sum: { total: true }
    })
    
    const payments = await prisma.payment.aggregate({
      where: { schoolId, status: "COMPLETED" },
      _sum: { amount: true }
    })
    
    const totalBilled = invoices._sum.total || 0
    const totalCollected = payments._sum.amount || 0
    const outstanding = Math.max(0, totalBilled - totalCollected)
    const recoveryRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0
    
    // 2. Monthly KPI History (Last 6 Months)
    const months: string[] = []
    const kpiPromises = []
    
    for (let i = 5; i >= 0; i--) {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999)
      
      months.push(startOfMonth.toLocaleString('default', { month: 'short', year: 'numeric' }))
      
      kpiPromises.push(
        Promise.all([
          prisma.invoice.aggregate({
            where: { schoolId, status: { notIn: ["DRAFT", "CANCELLED"] }, dueDate: { gte: startOfMonth, lte: endOfMonth } },
            _sum: { total: true }
          }),
          prisma.payment.aggregate({
            where: { schoolId, status: "COMPLETED", date: { gte: startOfMonth, lte: endOfMonth } },
            _sum: { amount: true }
          })
        ])
      )
    }
    
    const kpiResults = await Promise.all(kpiPromises)
    
    const kpiHistory = kpiResults.map((result, idx) => {
      const monthBilled = result[0]._sum.total || 0
      const monthCollected = result[1]._sum.amount || 0
      const monthRecoveryRate = monthBilled > 0 ? (monthCollected / monthBilled) * 100 : 0
      
      return {
        month: months[idx],
        billed: monthBilled,
        collected: monthCollected,
        outstanding: Math.max(0, monthBilled - monthCollected),
        recoveryRate: Number(monthRecoveryRate.toFixed(2))
      }
    })
    
    return {
      totalBilled,
      totalCollected,
      outstanding,
      recoveryRate: Number(recoveryRate.toFixed(2)),
      kpiHistory
    }
  },
  ["collection-metrics"],
  { revalidate: 900 } // 15 mins cache TTL
)

export async function getCollectionMetrics() {
  return withDAL("collection.dashboard", async () => {
    const ctx = await getTenantContext()
    
    if (!ALLOWED_ROLES.includes(ctx.schoolRole || "")) {
      throw new TenantError("Access denied: Executive Dashboard permissions required.")
    }
    
    return getCollectionMetricsCached(ctx.schoolId)
  })
}
