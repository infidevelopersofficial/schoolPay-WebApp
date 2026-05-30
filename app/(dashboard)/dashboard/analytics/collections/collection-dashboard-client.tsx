"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, AlertCircle, TrendingUp, DollarSign, Activity } from "lucide-react"

export default function CollectionDashboardClient({
  metrics,
  recovery,
  penalty,
  defaulters,
  forecast,
  recommendations,
  aging
}: any) {
  return (
    <div className="space-y-6">
      {/* Principal Recommendations */}
      <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
        <CardHeader>
          <CardTitle className="text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <Activity className="h-5 w-5" /> Executive Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {recommendations.map((rec: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-emerald-700 dark:text-emerald-400">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-slate-500">Total Billed</p>
              <DollarSign className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold">₹{metrics.totalBilled.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-slate-500">Total Collected</p>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-600">₹{metrics.totalCollected.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-slate-500">Recovery Rate</p>
              <Activity className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold">{metrics.recoveryRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-slate-500">Forecast (30 days)</p>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-600">₹{forecast.forecastedCollection.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aging Report */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Aging Report</CardTitle>
              <CardDescription>Outstanding balances by days overdue</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => alert('Exporting to CSV...')}>
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(aging.buckets).map(([key, value]: any) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="capitalize">{key.replace('days', '').replace('_', '-')}</span>
                  <span className="font-semibold">₹{value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* High Risk Defaulters */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-rose-500" /> High Risk Defaulters
              </CardTitle>
              <CardDescription>Accounts flagged for critical action</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => alert('Exporting to CSV...')}>
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {defaulters.slice(0, 5).map((def: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div>
                    <p className="font-medium">{def.studentName}</p>
                    <p className="text-xs text-slate-500">Class {def.class} • Risk Score: {def.riskScore}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-rose-600">₹{def.outstandingAmount.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">{def.riskCategory}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
