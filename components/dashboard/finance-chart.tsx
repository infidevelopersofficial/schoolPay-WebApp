"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from "recharts"

const data = [
  { month: "Jan", income: 8000, expense: 4000 },
  { month: "Feb", income: 9500, expense: 5000 },
  { month: "Mar", income: 7000, expense: 3500 },
  { month: "Apr", income: 8500, expense: 4200 },
  { month: "May", income: 11000, expense: 6000 },
  { month: "Jun", income: 9000, expense: 4800 },
  { month: "Jul", income: 10500, expense: 5500 },
  { month: "Aug", income: 8200, expense: 4100 },
  { month: "Sep", income: 9800, expense: 5200 },
  { month: "Oct", income: 10200, expense: 5400 },
  { month: "Nov", income: 11500, expense: 6200 },
  { month: "Dec", income: 12000, expense: 6500 },
]

export function FinanceChart() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Finance</CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-4 bg-[#93c5fd]" />
            <span className="text-sm text-muted-foreground">income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-4 bg-[#fef08a]" />
            <span className="text-sm text-muted-foreground">expense</span>
          </div>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
              <Line type="monotone" dataKey="income" stroke="#93c5fd" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="expense" stroke="#fef08a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
