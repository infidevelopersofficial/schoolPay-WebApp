import { getParentDashboard } from "@/lib/dal/parent-portal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IndianRupee, Receipt, CheckCircle, Clock, AlertTriangle } from "lucide-react"

export const metadata = {
  title: "Fees & Payments — Parent Portal",
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    PENDING: "bg-amber-100 text-amber-700 border-amber-200",
    FAILED: "bg-red-100 text-red-700 border-red-200",
    REFUNDED: "bg-slate-100 text-slate-600 border-slate-200",
  }
  return styles[status] ?? "bg-slate-100 text-slate-600"
}

export default async function ParentFeesPage() {
  const data = await getParentDashboard()
  const students = data?.students ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Fees & Payments</h1>
        <p className="text-slate-500 mt-1 text-sm">Track your children's fee status and payment history</p>
      </div>

      {students.map((student) => (
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

          {/* Fee summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                  <IndianRupee className="h-3.5 w-3.5" /> Total Fees
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  ₹{student.totalFees.toLocaleString("en-IN")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Paid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-emerald-600">
                  ₹{student.paidAmount.toLocaleString("en-IN")}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${student.pendingAmount > 0 ? "text-red-600" : "text-slate-400"}`}>
                  ₹{student.pendingAmount.toLocaleString("en-IN")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Progress bar */}
          {student.totalFees > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between text-xs text-slate-500 mb-2">
                <span>Payment Progress</span>
                <span>{Math.round((student.paidAmount / student.totalFees) * 100)}% paid</span>
              </div>
              <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-600 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (student.paidAmount / student.totalFees) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Payment history */}
          {student.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Receipt className="h-4 w-4" /> Recent Payments
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {student.payments.map((p, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{p.feeType}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          {p.receiptNumber && <span className="ml-2 text-slate-300">· {p.receiptNumber}</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={`text-xs ${statusBadge(p.status)}`}>
                          {p.status}
                        </Badge>
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          ₹{p.amount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ))}
    </div>
  )
}
