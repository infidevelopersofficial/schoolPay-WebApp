import { generateAgingReportCached } from "./aging-report"
import { identifyHighRiskDefaultersCached } from "@/lib/analytics/defaulter-intelligence"
import { getCollectionMetricsCached } from "@/lib/dal/collection-dashboard"

export async function exportAgingReportToCSV(schoolId: string): Promise<string> {
  const data = await generateAgingReportCached(schoolId)
  
  const headers = ["Invoice ID", "Student Name", "Class", "Due Date", "Amount", "Days Overdue", "Bucket"]
  const rows = data.reportEntries.map(entry => [
    entry.invoiceId,
    entry.studentName,
    entry.class,
    entry.dueDate.toISOString().split('T')[0],
    entry.amount.toString(),
    entry.daysOverdue.toString(),
    entry.bucket
  ])
  
  return [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
}

export async function exportDefaultersToCSV(schoolId: string): Promise<string> {
  const defaulters = await identifyHighRiskDefaultersCached(schoolId)
  
  const headers = ["Student ID", "Student Name", "Class", "Parent Phone", "Outstanding Amount", "Risk Score", "Risk Category", "Factors"]
  const rows = defaulters.map(d => [
    d.studentId,
    d.studentName,
    d.class,
    d.parentPhone || "N/A",
    d.outstandingAmount.toString(),
    d.riskScore.toString(),
    d.riskCategory,
    `"${d.factors.join("; ")}"`
  ])
  
  return [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
}

export async function exportMonthlyCollectionToCSV(schoolId: string): Promise<string> {
  const data = await getCollectionMetricsCached(schoolId)
  
  const headers = ["Month", "Total Billed", "Total Collected", "Outstanding", "Recovery Rate"]
  const rows = data.kpiHistory.map((entry: any) => [
    entry.month,
    entry.billed.toString(),
    entry.collected.toString(),
    entry.outstanding.toString(),
    entry.recoveryRate.toString()
  ])
  
  return [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n")
}
