"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

interface StudentsChartProps {
  boys: number
  girls: number
  other: number
  total: number
}

const COLORS = {
  Boys: "#93c5fd",
  Girls: "#fef08a",
  Other: "#86efac",
}

export function StudentsChart({ boys, girls, other, total }: StudentsChartProps) {
  const slices = [
    { name: "Boys", value: boys },
    { name: "Girls", value: girls },
    ...(other > 0 ? [{ name: "Other", value: other }] : []),
  ].filter((s) => s.value > 0)

  const pct = (n: number) => (total > 0 ? `${Math.round((n / total) * 100)}%` : "—")

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Students</CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex h-48 items-center justify-center">
            <p className="text-sm text-muted-foreground">No students enrolled yet</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="relative h-48 w-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slices}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {slices.map((entry) => (
                      <Cell key={entry.name} fill={COLORS[entry.name as keyof typeof COLORS] ?? "#d1d5db"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value.toLocaleString(), ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-xl font-bold">{total.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-6 flex-wrap justify-center">
              {boys > 0 && (
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#93c5fd]" />
                  <div>
                    <p className="text-lg font-semibold">{boys.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Boys ({pct(boys)})</p>
                  </div>
                </div>
              )}
              {girls > 0 && (
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#fef08a]" />
                  <div>
                    <p className="text-lg font-semibold">{girls.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Girls ({pct(girls)})</p>
                  </div>
                </div>
              )}
              {other > 0 && (
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#86efac]" />
                  <div>
                    <p className="text-lg font-semibold">{other.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Other ({pct(other)})</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
