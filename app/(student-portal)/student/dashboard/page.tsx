import { getMyDashboard, getMyProfile } from "@/lib/dal/student-portal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  CalendarCheck, 
  CreditCard, 
  FileText, 
  Bell, 
  Calendar,
  AlertCircle,
  GraduationCap
} from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Student Dashboard | SchoolPay",
}

export default async function StudentDashboardPage() {
  const [profile, dashboardData] = await Promise.all([
    getMyProfile(),
    getMyDashboard()
  ])

  const { metrics, recentResults, upcomingExams, latestAnnouncements } = dashboardData

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back, {profile.name}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your academics and fees today.
        </p>
      </div>

      {/* Quick Action Navigation Cards (Mobile Friendly) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/student/attendance">
          <Card className="hover:bg-muted/50 transition-colors border-primary/20">
            <CardContent className="p-4 flex flex-col items-center justify-center gap-2 text-center">
              <CalendarCheck className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Attendance</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/student/results">
          <Card className="hover:bg-muted/50 transition-colors border-primary/20">
            <CardContent className="p-4 flex flex-col items-center justify-center gap-2 text-center">
              <FileText className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Results</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/student/fees">
          <Card className="hover:bg-muted/50 transition-colors border-primary/20">
            <CardContent className="p-4 flex flex-col items-center justify-center gap-2 text-center">
              <CreditCard className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Fees & Dues</span>
            </CardContent>
          </Card>
        </Link>
        <Link href="/student/announcements">
          <Card className="hover:bg-muted/50 transition-colors border-primary/20">
            <CardContent className="p-4 flex flex-col items-center justify-center gap-2 text-center">
              <Bell className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Notices</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.attendancePercentage}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.presentDays} / {metrics.totalDays} days present
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Fees</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{metrics.pendingFeesAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.pendingInvoicesCount} invoice(s) due
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Exams</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.upcomingExamsCount}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled for your class
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Class</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.class}</div>
            <p className="text-xs text-muted-foreground">
              {profile.school.name}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Results */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Results</CardTitle>
          </CardHeader>
          <CardContent>
            {recentResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                <FileText className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No recent results published.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentResults.map((result) => (
                  <div key={result.id} className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0">
                    <div>
                      <p className="font-medium">{result.examName}</p>
                      <p className="text-xs text-muted-foreground">
                        {result.exam?.name || "Exam"} • {new Date(result.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{result.marks} <span className="text-xs font-normal text-muted-foreground">/ {result.maxMarks}</span></p>
                      <Badge variant="outline">{result.grade}</Badge>
                    </div>
                  </div>
                ))}
                <Link href="/student/results" className="text-sm text-primary hover:underline block pt-2">
                  View all results &rarr;
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Latest Announcements */}
        <Card>
          <CardHeader>
            <CardTitle>Latest Notices</CardTitle>
          </CardHeader>
          <CardContent>
            {latestAnnouncements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No new announcements.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {latestAnnouncements.map((announcement) => (
                  <div key={announcement.id} className="border-l-2 border-primary pl-3 pb-3 last:pb-0">
                    <p className="font-medium text-sm line-clamp-1">{announcement.title}</p>
                    <p className="text-xs text-muted-foreground my-1">
                      {new Date(announcement.createdAt).toLocaleDateString()} • {announcement.author}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {announcement.content}
                    </p>
                  </div>
                ))}
                <Link href="/student/announcements" className="text-sm text-primary hover:underline block pt-2">
                  View all notices &rarr;
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
