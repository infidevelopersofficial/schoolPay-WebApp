import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter, Download, Calendar, Users, CheckCircle, XCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const attendanceData = [
  {
    id: 1,
    student: "John Smith",
    studentId: "STU001",
    avatar: "/placeholder.svg?height=32&width=32",
    class: "Grade 10A",
    present: 78,
    absent: 8,
    late: 4,
    percentage: 89,
    status: "good",
  },
  {
    id: 2,
    student: "Sarah Johnson",
    studentId: "STU002",
    avatar: "/placeholder.svg?height=32&width=32",
    class: "Grade 10B",
    present: 82,
    absent: 4,
    late: 2,
    percentage: 95,
    status: "excellent",
  },
  {
    id: 3,
    student: "Michael Brown",
    studentId: "STU003",
    avatar: "/placeholder.svg?height=32&width=32",
    class: "Grade 9A",
    present: 75,
    absent: 11,
    late: 6,
    percentage: 82,
    status: "average",
  },
  {
    id: 4,
    student: "Emily Davis",
    studentId: "STU004",
    avatar: "/placeholder.svg?height=32&width=32",
    class: "Grade 11A",
    present: 85,
    absent: 1,
    late: 1,
    percentage: 99,
    status: "excellent",
  },
  {
    id: 5,
    student: "David Wilson",
    studentId: "STU005",
    avatar: "/placeholder.svg?height=32&width=32",
    class: "Grade 10A",
    present: 70,
    absent: 15,
    late: 5,
    percentage: 77,
    status: "poor",
  },
  {
    id: 6,
    student: "Lisa Anderson",
    studentId: "STU006",
    avatar: "/placeholder.svg?height=32&width=32",
    class: "Grade 9B",
    present: 80,
    absent: 6,
    late: 4,
    percentage: 91,
    status: "good",
  },
]

const todayAttendance = [
  { id: 1, student: "John Smith", class: "Grade 10A", status: "present", time: "08:45 AM" },
  { id: 2, student: "Sarah Johnson", class: "Grade 10B", status: "present", time: "08:30 AM" },
  { id: 3, student: "Michael Brown", class: "Grade 9A", status: "late", time: "09:15 AM" },
  { id: 4, student: "Emily Davis", class: "Grade 11A", status: "present", time: "08:25 AM" },
  { id: 5, student: "David Wilson", class: "Grade 10A", status: "absent", time: "-" },
  { id: 6, student: "Lisa Anderson", class: "Grade 9B", status: "present", time: "08:50 AM" },
]

const statusColors = {
  excellent: "bg-green-100 text-green-700",
  good: "bg-blue-100 text-blue-700",
  average: "bg-yellow-100 text-yellow-700",
  poor: "bg-red-100 text-red-700",
}

const attendanceStatusColors = {
  present: "bg-green-100 text-green-700",
  absent: "bg-red-100 text-red-700",
  late: "bg-yellow-100 text-yellow-700",
}

const stats = [
  { label: "Total Students", value: "1,234", icon: Users, color: "bg-blue-100 text-blue-600" },
  { label: "Present Today", value: "1,180", icon: CheckCircle, color: "bg-green-100 text-green-600" },
  { label: "Absent Today", value: "42", icon: XCircle, color: "bg-red-100 text-red-600" },
  { label: "Avg Attendance", value: "87.5%", icon: Calendar, color: "bg-purple-100 text-purple-600" },
]

export default function AttendancePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
            <p className="text-sm text-muted-foreground">Track student and staff attendance</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Mark Attendance
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="today">Today's Attendance</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search students..." className="pl-10" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  <SelectItem value="9a">Grade 9A</SelectItem>
                  <SelectItem value="9b">Grade 9B</SelectItem>
                  <SelectItem value="10a">Grade 10A</SelectItem>
                  <SelectItem value="10b">Grade 10B</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Present</TableHead>
                    <TableHead>Absent</TableHead>
                    <TableHead>Late</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceData.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={record.avatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              {record.student
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{record.student}</p>
                            <p className="text-xs text-muted-foreground">{record.studentId}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{record.class}</TableCell>
                      <TableCell className="text-green-600 font-medium">{record.present}</TableCell>
                      <TableCell className="text-red-600 font-medium">{record.absent}</TableCell>
                      <TableCell className="text-yellow-600 font-medium">{record.late}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={record.percentage} className="w-20 h-2" />
                          <span className="text-sm font-medium">{record.percentage}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[record.status as keyof typeof statusColors]}>
                          {record.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="today" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Today's Attendance - January 15, 2025</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Check-in Time</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayAttendance.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.student}</TableCell>
                        <TableCell>{record.class}</TableCell>
                        <TableCell>
                          <Badge
                            className={attendanceStatusColors[record.status as keyof typeof attendanceStatusColors]}
                          >
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{record.time}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate monthly attendance report for selected class or all students.
                  </p>
                  <Button>Generate Report</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Student Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Generate individual student attendance report.</p>
                  <Button>Generate Report</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
