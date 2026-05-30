import { prisma } from "@/lib/prisma"
import { getTenantContext, TenantError } from "@/lib/tenant-context"
import { withDAL } from "@/lib/dal/utils"
import { unstable_cache } from "next/cache"

const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"]

export const generateAgingReportCached = unstable_cache(
  async (schoolId: string) => {
    const now = new Date()
    
    // Fetch all unpaid invoices
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        schoolId,
        status: { in: ["SENT", "OVERDUE"] }
      },
      select: {
        id: true,
        dueDate: true,
        total: true,
        student: { select: { id: true, name: true, class: true } }
      }
    })

    const buckets = {
      current: 0,
      days1_15: 0,
      days16_30: 0,
      days31_60: 0,
      days61_90: 0,
      days90Plus: 0,
    }

    const reportEntries = []

    for (const inv of unpaidInvoices) {
      const daysOverdue = Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 3600 * 24))
      let bucketName = "Current"

      if (daysOverdue > 90) { bucketName = "90+ Days"; buckets.days90Plus += inv.total }
      else if (daysOverdue > 60) { bucketName = "61-90 Days"; buckets.days61_90 += inv.total }
      else if (daysOverdue > 30) { bucketName = "31-60 Days"; buckets.days31_60 += inv.total }
      else if (daysOverdue > 15) { bucketName = "16-30 Days"; buckets.days16_30 += inv.total }
      else if (daysOverdue > 0) { bucketName = "1-15 Days"; buckets.days1_15 += inv.total }
      else { buckets.current += inv.total }

      reportEntries.push({
        invoiceId: inv.id,
        studentName: inv.student.name,
        class: inv.student.class,
        dueDate: inv.dueDate,
        amount: inv.total,
        daysOverdue: Math.max(0, daysOverdue),
        bucket: bucketName
      })
    }

    return { buckets, reportEntries }
  },
  ["aging-report"],
  { revalidate: 900 }
)

export async function generateAgingReport() {
  return withDAL("reports.aging", async () => {
    const ctx = await getTenantContext()
    if (!ALLOWED_ROLES.includes(ctx.schoolRole || "")) {
      throw new TenantError("Access denied: Executive Dashboard permissions required.")
    }
    return generateAgingReportCached(ctx.schoolId)
  })
}
