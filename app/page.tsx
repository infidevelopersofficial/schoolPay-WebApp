import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { StatCard } from "@/components/dashboard/stat-card"
import { StudentsChart } from "@/components/dashboard/students-chart"
import { AttendanceChart } from "@/components/dashboard/attendance-chart"
import { FinanceChart } from "@/components/dashboard/finance-chart"
import { CalendarWidget } from "@/components/dashboard/calendar-widget"
import { EventsWidget } from "@/components/dashboard/events-widget"
import { AnnouncementsWidget } from "@/components/dashboard/announcements-widget"
import { Card, CardContent } from "@/components/ui/card"
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"

const financeStats = [
  {
    title: "Total Collected",
    value: "$245,890",
    change: "+12.5%",
    icon: DollarSign,
    color: "bg-green-100 text-green-600",
  },
  {
    title: "Pending Payments",
    value: "$45,230",
    change: "152 students",
    icon: TrendingUp,
    color: "bg-yellow-100 text-yellow-600",
  },
  {
    title: "Overdue Fees",
    value: "$12,450",
    change: "34 students",
    icon: AlertTriangle,
    color: "bg-red-100 text-red-600",
  },
  {
    title: "Collection Rate",
    value: "87.5%",
    change: "+5.2% from last month",
    icon: CheckCircle,
    color: "bg-blue-100 text-blue-600",
  },
]

export default function HomePage() {
  return (
    <DashboardLayout>
      <div className="grid grid-cols-12 gap-6">
        {/* Main content - Left side */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Students" value="1,234" year="2024/25" color="purple" />
            <StatCard title="Teachers" value="123" year="2024/25" color="yellow" />
            <StatCard title="Parents" value="1,089" year="2024/25" color="purple" />
            <StatCard title="Staff" value="45" year="2024/25" color="yellow" />
          </div>

          {/* Finance Stats */}
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

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StudentsChart />
            <AttendanceChart />
          </div>

          {/* Finance Chart */}
          <FinanceChart />
        </div>

        {/* Sidebar - Right side */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <CalendarWidget />
          <EventsWidget />
          <AnnouncementsWidget />
        </div>
      </div>
    </DashboardLayout>
  )
}
