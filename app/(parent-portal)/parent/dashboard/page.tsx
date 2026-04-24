import { getParentDashboard } from "@/lib/dal/parent-portal"
import { auth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  GraduationCap, IndianRupee, ClipboardList,
  TrendingUp, Bell, Star, Calendar, CheckCircle, XCircle, Clock
} from "lucide-react"
import Link from "next/link"

function feeStatusColor(status: string) {
  if (status === "PAID") return "bg-emerald-100 text-emerald-700 border-emerald-200"
  if (status === "OVERDUE") return "bg-red-100 text-red-700 border-red-200"
  if (status === "PARTIAL") return "bg-amber-100 text-amber-700 border-amber-200"
  return "bg-slate-100 text-slate-600 border-slate-200"
}

function attendanceSummary(records: { status: string }[]) {
  const total = records.length
  if (total === 0) return { present: 0, absent: 0, rate: 0 }
  const present = records.filter((r) => r.status === "PRESENT" || r.status === "LATE").length
  const absent = records.filter((r) => r.status === "ABSENT").length
  return { present, absent, rate: Math.round((present / total) * 100) }
}

export const metadata = {
  title: "Dashboard — Parent Portal",
  description: "Overview of your children's school performance and fee status",
}

export default async function ParentDashboardPage() {
  const session = await auth()
  const user = session?.user as any
  const data = await getParentDashboard()

  const students = data?.students ?? []
  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return "Good morning"
    if (h < 17) return "Good afternoon"
    return "Good evening"
  })()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {greeting}, {user?.name?.split(" ")[0] ?? "Parent"} 👋
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Here's a summary of your {students.length === 1 ? "child's" : "children's"} school activity
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <Calendar className="h-4 w-4" />
          {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      {students.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <GraduationCap className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">No children linked to your account yet</p>
            <p className="text-slate-400 text-sm mt-1">Please contact the school admin to link your children</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {students.map((student) => {
            const att = attendanceSummary(student.attendance)
            const recentPayment = student.payments[0]
            const recentResult = student.results[0]

            return (
              <div key={student.id} className="space-y-4">
                {/* Student header card */}
                <div className="flex items-center gap-4 bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-md flex-shrink-0">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {student.name}
                      </h2>
                      <Badge variant="outline" className={feeStatusColor(student.feeStatus)}>
                        {student.feeStatus}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Class {student.class}{student.section ? ` · Section ${student.section}` : ""}
                      {student.rollNumber ? ` · Roll No. ${student.rollNumber}` : ""}
                    </p>
                  </div>
                  <Link
                    href={`/parent/students/${student.id}`}
                    className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    View Details →
                  </Link>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Fees */}
                  <Card className="group hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                        <IndianRupee className="h-3.5 w-3.5" /> Fee Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        ₹{student.paidAmount.toLocaleString("en-IN")}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        paid of ₹{student.totalFees.toLocaleString("en-IN")}
                      </p>
                      {student.pendingAmount > 0 && (
                        <p className="text-xs text-red-500 font-medium mt-1">
                          ₹{student.pendingAmount.toLocaleString("en-IN")} pending
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Attendance */}
                  <Card className="group hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                        <ClipboardList className="h-3.5 w-3.5" /> Attendance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {att.rate}%
                      </p>
                      <div className="flex gap-3 text-xs mt-1">
                        <span className="flex items-center gap-0.5 text-emerald-600">
                          <CheckCircle className="h-3 w-3" /> {att.present}
                        </span>
                        <span className="flex items-center gap-0.5 text-red-500">
                          <XCircle className="h-3 w-3" /> {att.absent}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">last 30 days</p>
                    </CardContent>
                  </Card>

                  {/* Latest result */}
                  <Card className="group hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5" /> Latest Result
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {recentResult ? (
                        <>
                          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            {recentResult.grade}
                          </p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{recentResult.examName}</p>
                          <p className="text-xs text-slate-400">{recentResult.percentage.toFixed(1)}%</p>
                        </>
                      ) : (
                        <p className="text-sm text-slate-400">No results yet</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Last payment */}
                  <Card className="group hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5" /> Last Payment
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {recentPayment ? (
                        <>
                          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                            ₹{recentPayment.amount.toLocaleString("en-IN")}
                          </p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{recentPayment.feeType}</p>
                          <p className="text-xs text-slate-400">
                            {new Date(recentPayment.date).toLocaleDateString("en-IN")}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-slate-400">No payments yet</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
