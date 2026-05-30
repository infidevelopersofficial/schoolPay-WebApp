import { getTenantContext, TenantError } from "@/lib/tenant-context"
import { withDAL } from "@/lib/dal/utils"
import { unstable_cache } from "next/cache"
import { identifyHighRiskDefaultersCached } from "./defaulter-intelligence"
import { generateDeterministicForecastCached } from "./collection-forecast"

const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"]

export const generateRecommendationsCached = unstable_cache(
  async (schoolId: string) => {
    const recommendations: string[] = []
    
    const defaulters = await identifyHighRiskDefaultersCached(schoolId)
    const forecast = await generateDeterministicForecastCached(schoolId)

    // Insight 1: Concentration of debt among top defaulters
    if (defaulters.length > 0) {
      const top15 = defaulters.slice(0, 15)
      const top15Debt = top15.reduce((sum, d) => sum + d.outstandingAmount, 0)
      const totalDebt = defaulters.reduce((sum, d) => sum + d.outstandingAmount, 0)
      
      if (totalDebt > 0) {
        const percentage = Math.round((top15Debt / totalDebt) * 100)
        if (percentage >= 25) {
          recommendations.push(`${top15.length} families account for ${percentage}% of all outstanding dues (₹${top15Debt.toLocaleString()}). Focus recovery efforts here first.`)
        }
      }

      // Insight 2: Class level concentration
      const classDebtMap: Record<string, number> = {}
      for (const d of defaulters) {
        classDebtMap[d.class] = (classDebtMap[d.class] || 0) + d.outstandingAmount
      }
      
      const highestClass = Object.keys(classDebtMap).sort((a, b) => classDebtMap[b] - classDebtMap[a])[0]
      if (highestClass && totalDebt > 0) {
        const classPercentage = Math.round((classDebtMap[highestClass] / totalDebt) * 100)
        if (classPercentage >= 15) {
          recommendations.push(`Class ${highestClass} contributes ${classPercentage}% of total overdue balances (₹${classDebtMap[highestClass].toLocaleString()}). Consider a class-wide communication.`)
        }
      }
    }

    // Insight 3: Forecasted recovery
    if (forecast.forecastedCollection > 0) {
      recommendations.push(`₹${forecast.forecastedCollection.toLocaleString()} can likely be recovered within the next 30 days based on historical payment patterns.`)
    }

    // Default if no insights
    if (recommendations.length === 0) {
      recommendations.push("Collection metrics are healthy. No critical actions required at this time.")
    }

    return recommendations
  },
  ["collection-recommendations"],
  { revalidate: 900 }
)

export async function generateRecommendations() {
  return withDAL("analytics.recommendations", async () => {
    const ctx = await getTenantContext()
    if (!ALLOWED_ROLES.includes(ctx.schoolRole || "")) {
      throw new TenantError("Access denied: Executive Dashboard permissions required.")
    }
    return generateRecommendationsCached(ctx.schoolId)
  })
}
