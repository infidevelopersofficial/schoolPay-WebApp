import { getParentDashboard } from "@/lib/dal/parent-portal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ClipboardList, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"

export const metadata = {
  title: "Attendance — Parent Portal",
}

const STATUS_CONFIG = {
  PRESENT: { label: "Present", icon: CheckCircle, color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  ABSENT: { label: "Absent", icon: XCircle, color: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500" },
  LATE: { label: "Late", icon: Clock, color: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  EXCUSED: { label: "Excused", icon: AlertCircle, color: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500" },
} as const

export default async function ParentAttendancePage() {
  const data = await getParentDashboard()
  const students = data?.students ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Attendance</h1>
        <p className="text-slate-500 mt-1 text-sm">Last 30 days attendance record</p>
      </div>

      {students.map((student) => {
        const total = student.attendance.length
        const present = student.attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length
        const absent = student.attendance.filter((a) => a.status === "ABSENT").length
        const rate = total > 0 ? Math.round((present / total) * 100) : 0

        return (
          <div key={student.id} className="space-y-4">
            {/* Child header */}
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                {student.name.charAt(0)}
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">{student.name}</h2>
                <p className="text-xs text-slate-500">Class {student.class}</p>
              </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Rate", value: `${rate}%`, color: rate >= 75 ? "text-emerald-600" : "text-red-600" },
                { label: "Present", value: present, color: "text-emerald-600" },
                { label: "Absent", value: absent, color: "text-red-600" },
                { label: "Total", value: total, color: "text-slate-600" },
              ].map((s) => (
                <Card key={s.label}>
                  <CardContent className="pt-4 pb-3 text-center">
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Attendance records */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" /> Daily Records
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {student.attendance.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm py-8">No attendance records</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {student.attendance.map((record, i) => {
                      const cfg = STATUS_CONFIG[record.status as keyof typeof STATUS_CONFIG]
                      const Icon = cfg?.icon ?? CheckCircle
                      return (
                        <div key={i} className="flex items-center justify-between px-5 py-2.5">
                          <div className="flex items-center gap-3">
                            <div className={`h-2 w-2 rounded-full ${cfg?.dot ?? "bg-slate-300"}`} />
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                              {new Date(record.date).toLocaleDateString("en-IN", {
                                weekday: "short", day: "numeric", month: "short"
                              })}
                            </span>
                          </div>
                          <Badge variant="outline" className={`text-xs ${cfg?.color ?? ""}`}>
                            <Icon className="h-3 w-3 mr-1" />
                            {cfg?.label ?? record.status}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )
      })}
    </div>
  )
}
