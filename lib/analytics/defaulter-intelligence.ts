import { prisma } from "@/lib/prisma"
import { getTenantContext, TenantError } from "@/lib/tenant-context"
import { withDAL } from "@/lib/dal/utils"
import { unstable_cache } from "next/cache"

const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"]

export type RiskCategory = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

export interface DefaulterRiskProfile {
  studentId: string
  studentName: string
  class: string
  parentPhone: string | null
  outstandingAmount: number
  riskScore: number
  riskCategory: RiskCategory
  factors: string[]
}

export const identifyHighRiskDefaultersCached = unstable_cache(
  async (schoolId: string): Promise<DefaulterRiskProfile[]> => {
    // Only fetch students who actually have pending amounts or overdue status
    const defaulters = await prisma.student.findMany({
      where: {
        schoolId,
        OR: [
          { feeStatus: "OVERDUE" },
          { pendingAmount: { gt: 0 } }
        ]
      },
      select: {
        id: true,
        name: true,
        class: true,
        pendingAmount: true,
        parent: { select: { mobile: true } },
        invoices: {
          where: { status: { in: ["OVERDUE", "PAID", "SENT"] } },
          orderBy: { dueDate: "desc" },
          take: 5
        }
      }
    })

    const now = new Date()
    const profiles: DefaulterRiskProfile[] = []

    for (const student of defaulters) {
      let riskScore = 0
      const factors: string[] = []

      // Calculate days overdue for the oldest unpaid invoice
      const unpaidInvoices = student.invoices.filter(inv => inv.status === "OVERDUE" || (inv.status === "SENT" && inv.dueDate < now))
      
      if (unpaidInvoices.length > 0) {
        // Oldest unpaid
        const oldestUnpaid = unpaidInvoices[unpaidInvoices.length - 1]
        const daysOverdue = Math.floor((now.getTime() - oldestUnpaid.dueDate.getTime()) / (1000 * 3600 * 24))

        if (daysOverdue > 30) {
          riskScore += 30
          factors.push("Overdue > 30 days")
        }
        if (daysOverdue > 60) {
          riskScore += 20
          factors.push("Overdue > 60 days")
        }
      }

      // High outstanding balance
      if (student.pendingAmount > 10000) {
        riskScore += 25
        factors.push("Outstanding > ₹10,000")
      }

      // Missed last 3 invoices check
      // Sort invoices by date desc
      const latestInvoices = student.invoices.slice(0, 3)
      if (latestInvoices.length === 3 && latestInvoices.every(inv => inv.status === "OVERDUE" || (inv.status === "SENT" && inv.dueDate < now))) {
        riskScore += 25
        factors.push("Missed last 3 invoices")
      }

      // Cap at 100
      riskScore = Math.min(riskScore, 100)

      let riskCategory: RiskCategory = "LOW"
      if (riskScore >= 76) riskCategory = "CRITICAL"
      else if (riskScore >= 51) riskCategory = "HIGH"
      else if (riskScore >= 26) riskCategory = "MEDIUM"

      // Only include if there is some risk or outstanding
      if (riskScore > 0 || student.pendingAmount > 0) {
        profiles.push({
          studentId: student.id,
          studentName: student.name,
          class: student.class,
          parentPhone: student.parent?.mobile || null,
          outstandingAmount: student.pendingAmount,
          riskScore,
          riskCategory,
          factors
        })
      }
    }

    // Sort by risk score descending
    return profiles.sort((a, b) => b.riskScore - a.riskScore)
  },
  ["defaulter-intelligence"],
  { revalidate: 900 }
)

export async function identifyHighRiskDefaulters() {
  return withDAL("analytics.defaulters", async () => {
    const ctx = await getTenantContext()
    if (!ALLOWED_ROLES.includes(ctx.schoolRole || "")) {
      throw new TenantError("Access denied: Executive Dashboard permissions required.")
    }
    return identifyHighRiskDefaultersCached(ctx.schoolId)
  })
}
