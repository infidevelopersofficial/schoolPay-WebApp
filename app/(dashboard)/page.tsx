import { prisma } from "@/lib/prisma"
import { StatCard } from "@/components/dashboard/stat-card"
import { StudentsChart } from "@/components/dashboard/students-chart"
import { AttendanceChart } from "@/components/dashboard/attendance-chart"
import { FinanceChart } from "@/components/dashboard/finance-chart"
import { CalendarWidget } from "@/components/dashboard/calendar-widget"
import { EventsWidget } from "@/components/dashboard/events-widget"
import { AnnouncementsWidget } from "@/components/dashboard/announcements-widget"
import { Card, CardContent } from "@/components/ui/card"
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function fmt(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`
  return `$${amount.toFixed(0)}`
}

export default async function HomePage() {
  const now = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1)

  // Monday of the current ISO week
  const dow = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1))
  monday.setHours(0, 0, 0, 0)
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)
  friday.setHours(23, 59, 59, 999)

  const [
    studentCount,
    teacherCount,
    parentCount,
    staffCount,
    boyCount,
    girlCount,
    collectedAgg,
    pendingCount,
    overdueCount,
    pendingAmountAgg,
    overdueAmountAgg,
    yearPayments,
    weekAttendance,
    upcomingEvents,
    activeAnnouncements,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.parent.count(),
    prisma.user.count(),
    prisma.student.count({ where: { gender: "Male" } }),
    prisma.student.count({ where: { gender: "Female" } }),
    prisma.payment.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
    prisma.student.count({ where: { feeStatus: { in: ["PENDING", "PARTIAL"] } } }),
    prisma.student.count({ where: { feeStatus: "OVERDUE" } }),
    prisma.student.aggregate({
      where: { feeStatus: { in: ["PENDING", "PARTIAL"] } },
      _sum: { pendingAmount: true },
    }),
    prisma.student.aggregate({
      where: { feeStatus: "OVERDUE" },
      _sum: { pendingAmount: true },
    }),
    prisma.payment.findMany({
      where: { status: "COMPLETED", date: { gte: yearStart } },
      select: { amount: true, date: true },
    }),
    prisma.attendance.findMany({
      where: { date: { gte: monday, lte: friday } },
      select: { date: true, status: true },
    }),
    prisma.event.findMany({
      where: { status: "UPCOMING" },
      orderBy: { date: "asc" },
      take: 5,
    }),
    prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ])

  // ── Finance stats ─────────────────────────────────────────────────────────────
  const totalCollected = collectedAgg._sum.amount ?? 0
  const totalPendingAmount = pendingAmountAgg._sum.pendingAmount ?? 0
  const totalOverdueAmount = overdueAmountAgg._sum.pendingAmount ?? 0
  const totalBilled = totalCollected + totalPendingAmount + totalOverdueAmount
  const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0

  const financeStats = [
    {
      title: "Total Collected",
      value: fmt(totalCollected),
      change: totalCollected > 0 ? "From completed payments" : "No payments yet",
      icon: DollarSign,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Pending Payments",
      value: fmt(totalPendingAmount),
      change: pendingCount > 0 ? `${pendingCount} student${pendingCount !== 1 ? "s" : ""}` : "None pending",
      icon: TrendingUp,
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      title: "Overdue Fees",
      value: fmt(totalOverdueAmount),
      change: overdueCount > 0 ? `${overdueCount} student${overdueCount !== 1 ? "s" : ""}` : "None overdue",
      icon: AlertTriangle,
      color: "bg-red-100 text-red-600",
    },
    {
      title: "Collection Rate",
      value: `${collectionRate.toFixed(1)}%`,
      change: totalBilled > 0 ? `of ${fmt(totalBilled)} billed` : "No fees assigned yet",
      icon: CheckCircle,
      color: "bg-blue-100 text-blue-600",
    },
  ]

  // ── Monthly collections for FinanceChart ──────────────────────────────────────
  const monthlyChartData = MONTHS.map((month, i) => ({
    month,
    collected: yearPayments
      .filter((p) => new Date(p.date).getMonth() === i)
      .reduce((sum, p) => sum + p.amount, 0),
  }))

  // ── Gender breakdown for StudentsChart ────────────────────────────────────────
  const otherGender = Math.max(0, studentCount - boyCount - girlCount)

  // ── Weekly attendance for AttendanceChart ─────────────────────────────────────
  const attendanceData = ["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, i) => {
    const target = new Date(monday)
    target.setDate(monday.getDate() + i)
    const dateStr = target.toDateString()
    const records = weekAttendance.filter((r) => new Date(r.date).toDateString() === dateStr)
    return {
      day,
      present: records.filter((r) => r.status === "PRESENT" || r.status === "LATE").length,
      absent: records.filter((r) => r.status === "ABSENT").length,
    }
  })

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Main content */}
      <div className="col-span-12 lg:col-span-8 space-y-6">
        {/* Entity counts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Students" value={studentCount} year="2024/25" color="purple" />
          <StatCard title="Teachers" value={teacherCount} year="2024/25" color="yellow" />
          <StatCard title="Parents" value={parentCount} year="2024/25" color="purple" />
          <StatCard title="Staff" value={staffCount} year="2024/25" color="yellow" />
        </div>

        {/* Finance summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {financeStats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                    <p className="text-lg font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StudentsChart boys={boyCount} girls={girlCount} other={otherGender} total={studentCount} />
          <AttendanceChart data={attendanceData} />
        </div>

        {/* Finance chart */}
        <FinanceChart data={monthlyChartData} />
      </div>

      {/* Sidebar */}
      <div className="col-span-12 lg:col-span-4 space-y-6">
        <CalendarWidget />
        <EventsWidget events={upcomingEvents} />
        <AnnouncementsWidget announcements={activeAnnouncements} />
      </div>
    </div>
  )
}
