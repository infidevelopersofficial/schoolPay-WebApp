"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, TrendingUp, TrendingDown, PieChart, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function FinanceDashboardClient({
  revenue,
  expense,
  profitability,
  monthlySummary,
  scholarships,
  forecast
}: any) {
  return (
    <div className="space-y-6">
      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-slate-500">Net Revenue</p>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-600">₹{revenue.netRevenue.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">Collection Rate: {revenue.collectionRate}%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-slate-500">Total Expenses</p>
              <TrendingDown className="h-4 w-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-rose-600">₹{expense.totalExpenses.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-slate-500">Operating Profit</p>
              <TrendingUp className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-indigo-600">₹{profitability.operatingProfit.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">Margin: {profitability.operatingMargin}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-slate-500">Revenue Forecast (90d)</p>
              <PieChart className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-600">₹{forecast.window90.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scholarship Impact */}
        <Card>
          <CardHeader>
            <CardTitle>Scholarship Impact</CardTitle>
            <CardDescription>Value of granted scholarships and discounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <span className="font-medium">Total Granted</span>
                <span className="font-bold">{scholarships.totalScholarshipsGranted}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <span className="font-medium">Revenue Forgone</span>
                <span className="font-bold text-rose-500">₹{scholarships.revenueForgone.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <span className="font-medium">Impact on Recovery</span>
                <span className="font-bold">{scholarships.scholarshipRecoveryImpact}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expense Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
            <CardDescription>Top spending areas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expense.categoryBreakdown.length > 0 ? (
                expense.categoryBreakdown.slice(0, 5).map((cat: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                      <span className="capitalize">{cat.category}</span>
                    </div>
                    <span className="font-medium">₹{cat.amount.toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <div className="text-center text-sm text-slate-500 py-4">No expense data available</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-end pt-4">
        <Button onClick={() => alert('Exporting Financial Report...')} className="bg-amber-600 hover:bg-amber-700">
          <Download className="w-4 h-4 mr-2" /> Download Executive Report
        </Button>
      </div>
    </div>
  )
}
