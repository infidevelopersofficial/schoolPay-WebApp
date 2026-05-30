import { getRevenueAnalyticsCached, getExpenseAnalyticsCached } from "@/lib/finance/analytics"
import { getScholarshipAnalyticsCached } from "@/lib/finance/scholarship-analytics"
import { prisma } from "@/lib/prisma"

export async function exportRevenueReportCSV(schoolId: string): Promise<string> {
  const data = await getRevenueAnalyticsCached(schoolId)
  const headers = ["Metric", "Value"]
  const rows = [
    ["Gross Revenue", data.grossRevenue.toString()],
    ["Net Revenue (Collected)", data.netRevenue.toString()],
    ["Collection Rate (%)", data.collectionRate.toString()],
  ]
  return [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n")
}

export async function exportExpenseReportCSV(schoolId: string): Promise<string> {
  const expenses = await prisma.expense.findMany({
    where: { schoolId },
    orderBy: { expenseDate: "desc" },
    include: { createdBy: { select: { name: true } } },
  })

  const headers = ["Date", "Category", "Description", "Amount", "Created By"]
  const rows = expenses.map((e: any) => [
    e.expenseDate.toISOString().split("T")[0],
    e.category,
    `"${(e.description || "").replace(/"/g, '""')}"`,
    e.amount.toString(),
    e.createdBy.name,
  ])
  return [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n")
}

export async function exportProfitabilityReportCSV(schoolId: string): Promise<string> {
  const [revenue, expense] = await Promise.all([
    getRevenueAnalyticsCached(schoolId),
    getExpenseAnalyticsCached(schoolId),
  ])

  const profit = revenue.netRevenue - expense.totalExpenses
  const margin = revenue.netRevenue > 0 ? (profit / revenue.netRevenue) * 100 : 0

  const headers = ["Metric", "Value"]
  const rows = [
    ["Net Revenue", revenue.netRevenue.toString()],
    ["Total Expenses", expense.totalExpenses.toString()],
    ["Operating Profit", profit.toFixed(2)],
    ["Operating Margin (%)", margin.toFixed(2)],
  ]
  return [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n")
}

export async function exportScholarshipReportCSV(schoolId: string): Promise<string> {
  const data = await getScholarshipAnalyticsCached(schoolId)

  const headers = ["Metric", "Value"]
  const rows = [
    ["Total Scholarships Granted", data.totalScholarshipsGranted.toString()],
    ["Revenue Forgone", data.revenueForgone.toString()],
    ["Recovery Impact (%)", data.scholarshipRecoveryImpact.toString()],
  ]

  if (data.classDistribution.length > 0) {
    rows.push(["", ""])
    rows.push(["Class", "Scholarship Amount"])
    for (const c of data.classDistribution) {
      rows.push([c.class, c.amount.toString()])
    }
  }

  return [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n")
}
