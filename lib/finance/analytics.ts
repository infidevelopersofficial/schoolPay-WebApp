import { prisma } from "@/lib/prisma"
import { getTenantContext, TenantError } from "@/lib/tenant-context"
import { withDAL } from "@/lib/dal/utils"
import { unstable_cache } from "next/cache"

const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"]

export const getRevenueAnalyticsCached = unstable_cache(
  async (schoolId: string) => {
    // Gross Revenue (Total Invoiced amount)
    const grossRevenueQuery = await prisma.invoice.aggregate({
      where: { schoolId, status: { notIn: ["DRAFT", "CANCELLED"] } },
      _sum: { total: true }
    })
    
    // Net Revenue (Total Collected amount)
    const netRevenueQuery = await prisma.payment.aggregate({
      where: { schoolId, status: "COMPLETED" },
      _sum: { amount: true }
    })
    
    const grossRevenue = grossRevenueQuery._sum.total || 0
    const netRevenue = netRevenueQuery._sum.amount || 0
    
    // Calculate collection rate
    const collectionRate = grossRevenue > 0 ? (netRevenue / grossRevenue) * 100 : 0
    
    return {
      grossRevenue,
      netRevenue,
      collectionRate: Number(collectionRate.toFixed(2))
    }
  },
  ["finance-revenue"],
  { revalidate: 900 }
)

export const getExpenseAnalyticsCached = unstable_cache(
  async (schoolId: string) => {
    const expensesQuery = await prisma.expense.aggregate({
      where: { schoolId },
      _sum: { amount: true }
    })
    
    const categoryBreakdownQuery = await prisma.expense.groupBy({
      by: ["category"],
      where: { schoolId },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } }
    })
    
    const totalExpenses = expensesQuery._sum.amount || 0
    
    const categoryBreakdown = categoryBreakdownQuery.map((c: any) => ({
      category: c.category,
      amount: c._sum.amount || 0,
      percentage: totalExpenses > 0 ? ((c._sum.amount || 0) / totalExpenses) * 100 : 0
    }))
    
    return {
      totalExpenses,
      categoryBreakdown
    }
  },
  ["finance-expenses"],
  { revalidate: 900 }
)

export const getProfitabilityAnalyticsCached = unstable_cache(
  async (schoolId: string) => {
    const [revenueData, expenseData] = await Promise.all([
      getRevenueAnalyticsCached(schoolId),
      getExpenseAnalyticsCached(schoolId)
    ])
    
    const operatingProfit = revenueData.netRevenue - expenseData.totalExpenses
    const operatingMargin = revenueData.netRevenue > 0 
      ? (operatingProfit / revenueData.netRevenue) * 100 
      : 0
      
    return {
      operatingProfit,
      operatingMargin: Number(operatingMargin.toFixed(2))
    }
  },
  ["finance-profitability"],
  { revalidate: 900 }
)

export const getMonthlyFinancialSummaryCached = unstable_cache(
  async (schoolId: string) => {
    const now = new Date()
    const months: string[] = []
    const summaryPromises: Promise<any[]>[] = []
    
    for (let i = 5; i >= 0; i--) {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999)
      
      months.push(startOfMonth.toLocaleString('default', { month: 'short', year: 'numeric' }))
      
      summaryPromises.push(
        Promise.all([
          prisma.payment.aggregate({
            where: { schoolId, status: "COMPLETED", date: { gte: startOfMonth, lte: endOfMonth } },
            _sum: { amount: true }
          }),
          prisma.expense.aggregate({
            where: { schoolId, expenseDate: { gte: startOfMonth, lte: endOfMonth } },
            _sum: { amount: true }
          })
        ])
      )
    }
    
    const summariesRaw = await Promise.all(summaryPromises)
    
    const monthlySummary = summariesRaw.map((result: any, idx: number) => {
      const revenue = result[0]._sum.amount || 0
      const expense = result[1]._sum.amount || 0
      
      return {
        month: months[idx],
        revenue,
        expense,
        profit: revenue - expense
      }
    })
    
    return monthlySummary
  },
  ["finance-monthly-summary"],
  { revalidate: 900 }
)

// Server Action Endpoints
export async function getRevenueAnalytics() {
  return withDAL("finance.revenue", async () => {
    const ctx = await getTenantContext()
    if (!ALLOWED_ROLES.includes(ctx.schoolRole || "")) throw new TenantError("Access denied")
    return getRevenueAnalyticsCached(ctx.schoolId)
  })
}

export async function getExpenseAnalytics() {
  return withDAL("finance.expenses", async () => {
    const ctx = await getTenantContext()
    if (!ALLOWED_ROLES.includes(ctx.schoolRole || "")) throw new TenantError("Access denied")
    return getExpenseAnalyticsCached(ctx.schoolId)
  })
}

export async function getProfitabilityAnalytics() {
  return withDAL("finance.profit", async () => {
    const ctx = await getTenantContext()
    if (!ALLOWED_ROLES.includes(ctx.schoolRole || "")) throw new TenantError("Access denied")
    return getProfitabilityAnalyticsCached(ctx.schoolId)
  })
}

export async function getMonthlyFinancialSummary() {
  return withDAL("finance.monthly", async () => {
    const ctx = await getTenantContext()
    if (!ALLOWED_ROLES.includes(ctx.schoolRole || "")) throw new TenantError("Access denied")
    return getMonthlyFinancialSummaryCached(ctx.schoolId)
  })
}
