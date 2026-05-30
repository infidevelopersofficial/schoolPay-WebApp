import { prisma } from "@/lib/prisma"
import { getTenantContext, TenantError } from "@/lib/tenant-context"
import { withDAL } from "@/lib/dal/utils"
import { unstable_cache } from "next/cache"

const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"]

export const getRecoveryAnalyticsCached = unstable_cache(
  async (schoolId: string) => {
    // Breakdown by student fee statuses
    const studentFeeStatusesRaw = await prisma.student.groupBy({
      by: ["feeStatus"],
      where: { schoolId },
      _count: { _all: true },
    })
    
    const studentFeeStatuses = studentFeeStatusesRaw.map(s => ({
      status: s.feeStatus,
      count: s._count._all
    }))

    // Breakdown by fee type in payments
    const feeTypeMetricsRaw = await prisma.payment.groupBy({
      by: ["feeType"],
      where: { schoolId, status: "COMPLETED" },
      _sum: { amount: true },
    })
    
    const feeTypeMetrics = feeTypeMetricsRaw.map(f => ({
      type: f.feeType,
      amount: f._sum.amount || 0
    })).sort((a, b) => b.amount - a.amount)

    const totalStudents = await prisma.student.count({ where: { schoolId } })
    const defaultersCount = await prisma.student.count({
      where: { schoolId, feeStatus: "OVERDUE" },
    })

    return {
      studentFeeStatuses,
      feeTypeMetrics,
      totalStudents,
      defaultersCount,
      defaulterRate: totalStudents > 0 ? Number(((defaultersCount / totalStudents) * 100).toFixed(2)) : 0,
    }
  },
  ["recovery-analytics"],
  { revalidate: 900 }
)

export async function getRecoveryAnalytics() {
  return withDAL("analytics.recovery", async () => {
    const ctx = await getTenantContext()
    if (!ALLOWED_ROLES.includes(ctx.schoolRole || "")) {
      throw new TenantError("Access denied: Executive Dashboard permissions required.")
    }
    return getRecoveryAnalyticsCached(ctx.schoolId)
  })
}
