import { prisma } from "@/lib/prisma"
import { getTenantContext, TenantError } from "@/lib/tenant-context"
import { withDAL } from "@/lib/dal/utils"
import { unstable_cache } from "next/cache"

const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"]

export const getScholarshipAnalyticsCached = unstable_cache(
  async (schoolId: string) => {
    const invoicesWithDiscounts = await prisma.invoice.findMany({
      where: { schoolId, discountAmount: { gt: 0 }, status: { notIn: ["DRAFT", "CANCELLED"] } },
      select: {
        discountAmount: true,
        discountReason: true,
        createdAt: true,
        student: { select: { class: true } }
      }
    })

    let totalScholarshipsGranted = invoicesWithDiscounts.length
    let revenueForgone = 0
    const classDistribution: Record<string, number> = {}

    for (const inv of invoicesWithDiscounts) {
      const amt = inv.discountAmount || 0
      revenueForgone += amt
      
      const cls = inv.student.class
      classDistribution[cls] = (classDistribution[cls] || 0) + amt
    }

    const classDistributionArray = Object.keys(classDistribution).map(cls => ({
      class: cls,
      amount: classDistribution[cls]
    })).sort((a, b) => b.amount - a.amount)

    const grossRevenueQuery = await prisma.invoice.aggregate({
      where: { schoolId, status: { notIn: ["DRAFT", "CANCELLED"] } },
      _sum: { total: true }
    })
    
    const totalBilled = grossRevenueQuery._sum.total || 0
    const potentialRevenue = totalBilled + revenueForgone
    
    const scholarshipRecoveryImpact = potentialRevenue > 0 
      ? (revenueForgone / potentialRevenue) * 100 
      : 0

    return {
      totalScholarshipsGranted,
      revenueForgone,
      scholarshipRecoveryImpact: Number(scholarshipRecoveryImpact.toFixed(2)),
      classDistribution: classDistributionArray
    }
  },
  ["finance-scholarships"],
  { revalidate: 900 }
)

export async function getScholarshipAnalytics() {
  return withDAL("finance.scholarships", async () => {
    const ctx = await getTenantContext()
    if (!ALLOWED_ROLES.includes(ctx.schoolRole || "")) throw new TenantError("Access denied")
    return getScholarshipAnalyticsCached(ctx.schoolId)
  })
}
