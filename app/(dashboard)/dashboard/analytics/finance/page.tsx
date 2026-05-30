import { Metadata } from "next"
import { getRevenueAnalytics, getExpenseAnalytics, getProfitabilityAnalytics, getMonthlyFinancialSummary } from "@/lib/finance/analytics"
import { getScholarshipAnalytics } from "@/lib/finance/scholarship-analytics"
import { getRevenueForecast } from "@/lib/finance/revenue-forecast"
import FinanceDashboardClient from "./finance-dashboard-client"

export const metadata: Metadata = {
  title: "Financial Intelligence | SchoolPay",
  description: "Executive dashboard for institutional financial health.",
}

export default async function FinanceAnalyticsPage() {
  const [
    revenue,
    expense,
    profitability,
    monthlySummary,
    scholarships,
    forecast
  ] = await Promise.all([
    getRevenueAnalytics(),
    getExpenseAnalytics(),
    getProfitabilityAnalytics(),
    getMonthlyFinancialSummary(),
    getScholarshipAnalytics(),
    getRevenueForecast()
  ])

  return (
    <div className="space-y-8 p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">
            Financial Intelligence
          </h1>
          <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
            Real-time institutional revenue, expenses, profitability, and forecasting.
          </p>
        </div>
      </div>

      <FinanceDashboardClient 
        revenue={revenue}
        expense={expense}
        profitability={profitability}
        monthlySummary={monthlySummary}
        scholarships={scholarships}
        forecast={forecast}
      />
    </div>
  )
}
