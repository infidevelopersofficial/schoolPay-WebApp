import { getStudentProfile, getStudentTimeline } from "@/lib/dal/parent-portal"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  GraduationCap,
  Calendar,
  IndianRupee,
  Star,
  ClipboardList,
  CheckCircle,
  XCircle,
  Download,
  Clock,
  Bell,
  AlertTriangle,
  Megaphone,
  User
} from "lucide-react"
import { cn } from "@/lib/utils"

export const metadata = {
  title: "Student Profile — Parent Portal",
}

function feeStatusColor(status: string) {
  if (status === "PAID") return "bg-emerald-100 text-emerald-700 border-emerald-200"
  if (status === "OVERDUE") return "bg-red-100 text-red-700 border-red-200"
  if (status === "PARTIAL") return "bg-amber-100 text-amber-700 border-amber-200"
  return "bg-slate-100 text-slate-600 border-slate-200"
}

function getTimelineIcon(type: string) {
  switch (type) {
    case "ATTENDANCE_MARKED": return <ClipboardList className="h-4 w-4" />
    case "RESULT_PUBLISHED": return <Star className="h-4 w-4" />
    case "PAYMENT_RECEIVED": return <IndianRupee className="h-4 w-4" />
    case "ANNOUNCEMENT_POSTED": return <Megaphone className="h-4 w-4" />
    default: return <Bell className="h-4 w-4" />
  }
}

function getTimelineColor(type: string) {
  switch (type) {
    case "ATTENDANCE_MARKED": return "bg-blue-100 text-blue-700"
    case "RESULT_PUBLISHED": return "bg-purple-100 text-purple-700"
    case "PAYMENT_RECEIVED": return "bg-emerald-100 text-emerald-700"
    case "ANNOUNCEMENT_POSTED": return "bg-amber-100 text-amber-700"
    default: return "bg-slate-100 text-slate-700"
  }
}

export default async function ParentStudentProfilePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const studentId = params.id
  
  const [profile, timeline] = await Promise.all([
    getStudentProfile(studentId).catch(() => null),
    getStudentTimeline(studentId).catch(() => [])
  ])

  if (!profile) {
    notFound()
  }

  const activeEnrollment = profile.enrollments?.[0]
  const batch = activeEnrollment?.batch
  const session = batch?.session

  const totalAtt = profile.attendance.length
  const presentAtt = profile.attendance.filter((a: any) => a.status === "PRESENT" || a.status === "LATE").length
  const absentAtt = profile.attendance.filter((a: any) => a.status === "ABSENT").length
  const attRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Profile Card */}
      <Card className="border-none shadow-sm bg-gradient-to-br from-violet-600 to-indigo-700 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <GraduationCap className="w-64 h-64 -mt-12 -mr-12" />
        </div>
        <CardContent className="p-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold backdrop-blur-sm border-4 border-white/30 flex-shrink-0">
              {profile.name.charAt(0)}
            </div>
            <div className="text-center md:text-left flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <h1 className="text-3xl font-bold">{profile.name}</h1>
                <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm w-max mx-auto md:mx-0">
                  {batch ? `Class ${batch.grade}${batch.section ? ` ${batch.section}` : ""}` : `Class ${profile.class}`}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 text-indigo-100 text-sm">
                <div>
                  <p className="text-indigo-300 text-xs uppercase tracking-wider font-medium mb-1">Roll Number</p>
                  <p className="font-medium">{profile.rollNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-indigo-300 text-xs uppercase tracking-wider font-medium mb-1">Academic Year</p>
                  <p className="font-medium">{session?.name || "Current"}</p>
                </div>
                <div>
                  <p className="text-indigo-300 text-xs uppercase tracking-wider font-medium mb-1">Gender</p>
                  <p className="font-medium">{profile.gender || "N/A"}</p>
                </div>
                <div>
                  <p className="text-indigo-300 text-xs uppercase tracking-wider font-medium mb-1">Date of Birth</p>
                  <p className="font-medium">
                    {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString("en-IN") : "N/A"}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 min-w-[140px]">
              <Button variant="secondary" className="w-full bg-white text-indigo-700 hover:bg-indigo-50 border-none shadow-sm">
                <Download className="w-4 h-4 mr-2" />
                ID Card
              </Button>
              <Button variant="outline" className="w-full text-white border-white/30 hover:bg-white/10 hover:text-white">
                <Download className="w-4 h-4 mr-2" />
                Report Card
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats & Summaries */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Attendance Stat */}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Attendance</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{attRate}%</h3>
                  </div>
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 flex gap-4 text-sm">
                  <span className="flex items-center text-emerald-600">
                    <CheckCircle className="h-4 w-4 mr-1" /> {presentAtt}
                  </span>
                  <span className="flex items-center text-red-500">
                    <XCircle className="h-4 w-4 mr-1" /> {absentAtt}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Fees Stat */}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Fees Paid</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      ₹{profile.paidAmount.toLocaleString("en-IN")}
                    </h3>
                  </div>
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg">
                    <IndianRupee className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <Badge variant="outline" className={cn("text-xs font-normal", feeStatusColor(profile.feeStatus))}>
                    {profile.feeStatus}
                  </Badge>
                  {profile.pendingAmount > 0 && (
                    <span className="text-xs text-red-500 ml-2 font-medium">₹{profile.pendingAmount.toLocaleString()} pending</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Parent Info */}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Primary Parent</p>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate max-w-[120px]">
                      {profile.parent?.name || "N/A"}
                    </h3>
                  </div>
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-lg">
                    <User className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 text-sm text-slate-500">
                  {profile.parent?.relationship || "Guardian"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Deep dive sections can go here in future (e.g. detailed charts) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">About {profile.name.split(" ")[0]}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-sm leading-relaxed">
                {profile.name} is currently enrolled in {batch ? `Class ${batch.grade}${batch.section ? ` ${batch.section}` : ""}` : `Class ${profile.class}`} 
                for the {session?.name || "current"} academic session. 
                With an attendance rate of {attRate}%, {profile.name.split(" ")[0]} is maintaining a 
                {attRate >= 75 ? " good" : " concerning"} attendance record.
              </p>
              
              <div className="mt-6 flex gap-3">
                 <Link href="/parent/attendance">
                    <Button variant="outline" size="sm">View Full Attendance</Button>
                 </Link>
                 <Link href="/parent/results">
                    <Button variant="outline" size="sm">View All Results</Button>
                 </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Timeline */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest updates for {profile.name.split(" ")[0]}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {timeline.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-sm">No recent activity</p>
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-800 space-y-6">
                  {timeline.map((event: any, i: number) => (
                    <div key={event.id} className="relative">
                      <div className={cn(
                        "absolute -left-[35px] h-8 w-8 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-950",
                        getTimelineColor(event.type)
                      )}>
                        {getTimelineIcon(event.type)}
                      </div>
                      <div className="pt-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {event.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(event.date).toLocaleDateString("en-IN", {
                            month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
