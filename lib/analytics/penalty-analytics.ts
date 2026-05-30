import { prisma } from "@/lib/prisma"
import { getTenantContext, TenantError } from "@/lib/tenant-context"
import { withDAL } from "@/lib/dal/utils"
import { unstable_cache } from "next/cache"

const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"]

export const getPenaltyImpactCached = unstable_cache(
  async (schoolId: string) => {
    // Total penalties applied vs collected
    const totalPenaltiesRaw = await prisma.invoicePenalty.aggregate({
      where: { schoolId },
      _sum: { amount: true },
    })
    
    // Penalties on PAID invoices (assuming they were paid)
    const paidPenaltiesRaw = await prisma.invoicePenalty.aggregate({
      where: { schoolId, invoice: { status: "PAID" } },
      _sum: { amount: true },
    })
    
    const totalPenalties = totalPenaltiesRaw._sum.amount || 0
    const paidPenalties = paidPenaltiesRaw._sum.amount || 0
    const pendingPenalties = totalPenalties - paidPenalties

    const penaltyRecoveryRate = totalPenalties > 0 
      ? Number(((paidPenalties / totalPenalties) * 100).toFixed(2)) 
      : 0
      
    // Count of invoices with penalties
    const penalizedInvoicesCount = await prisma.invoicePenalty.groupBy({
      by: ["invoiceId"],
      where: { schoolId }
    })

    return {
      totalPenalties,
      paidPenalties,
      pendingPenalties,
      penaltyRecoveryRate,
      penalizedInvoicesCount: penalizedInvoicesCount.length
    }
  },
  ["penalty-analytics"],
  { revalidate: 900 }
)

export async function getPenaltyImpact() {
  return withDAL("analytics.penalty", async () => {
    const ctx = await getTenantContext()
    if (!ALLOWED_ROLES.includes(ctx.schoolRole || "")) {
      throw new TenantError("Access denied: Executive Dashboard permissions required.")
    }
    return getPenaltyImpactCached(ctx.schoolId)
  })
}
