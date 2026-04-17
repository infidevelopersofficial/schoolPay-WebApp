"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from "recharts"

interface AttendanceChartProps {
  data: { day: string; present: number; absent: number }[]
}

export function AttendanceChart({ data }: AttendanceChartProps) {
  const hasData = data.some((d) => d.present > 0 || d.absent > 0)
  const maxVal = Math.max(...data.map((d) => d.present + d.absent), 1)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Attendance</CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#fef08a]" />
            <span className="text-sm text-muted-foreground">present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#93c5fd]" />
            <span className="text-sm text-muted-foreground">absent</span>
          </div>
        </div>
        <div className="h-52">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  domain={[0, maxVal]}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="present" fill="#fef08a" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="absent" fill="#93c5fd" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">No attendance recorded this week</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
