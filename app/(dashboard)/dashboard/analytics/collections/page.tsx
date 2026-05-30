import { Metadata } from "next"
import { getCollectionMetrics } from "@/lib/dal/collection-dashboard"
import { getRecoveryAnalytics } from "@/lib/analytics/recovery-analytics"
import { getPenaltyImpact } from "@/lib/analytics/penalty-analytics"
import { identifyHighRiskDefaulters } from "@/lib/analytics/defaulter-intelligence"
import { generateDeterministicForecast } from "@/lib/analytics/collection-forecast"
import { generateRecommendations } from "@/lib/analytics/recommendations"
import { generateAgingReport } from "@/lib/reports/aging-report"
import CollectionDashboardClient from "./collection-dashboard-client"

export const metadata: Metadata = {
  title: "Fee Collection Analytics | SchoolPay",
  description: "Executive dashboard for fee recovery and financial intelligence.",
}

export default async function CollectionsAnalyticsPage() {
  const [
    metrics,
    recovery,
    penalty,
    defaulters,
    forecast,
    recommendations,
    aging
  ] = await Promise.all([
    getCollectionMetrics(),
    getRecoveryAnalytics(),
    getPenaltyImpact(),
    identifyHighRiskDefaulters(),
    generateDeterministicForecast(),
    generateRecommendations(),
    generateAgingReport()
  ])

  return (
    <div className="space-y-8 p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Fee Collection Intelligence
          </h1>
          <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
            Real-time financial analytics, defaulter tracking, and recovery forecasting.
          </p>
        </div>
      </div>

      <CollectionDashboardClient 
        metrics={metrics}
        recovery={recovery}
        penalty={penalty}
        defaulters={defaulters}
        forecast={forecast}
        recommendations={recommendations}
        aging={aging}
      />
    </div>
  )
}
