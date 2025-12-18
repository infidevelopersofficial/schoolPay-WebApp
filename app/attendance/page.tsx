"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter, Download, Calendar, Users, CheckCircle, XCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MarkAttendanceForm } from "@/components/forms"

const attendanceData = [
  { id: 1, student: "John Smith", studentId: "STU001", avatar: "/placeholder.svg?height=32&width=32", class: "Grade 10A", present: 78, absent: 8, late: 4, percentage: 89, status: "good" },
  { id: 2, student: "Sarah Johnson", studentId: "STU002", avatar: "/placeholder.svg?height=32&width=32", class: "Grade 10B", present: 82, absent: 4, late: 2, percentage: 95, status: "excellent" },
  { id: 3, student: "Michael Brown", studentId: "STU003", avatar: "/placeholder.svg?height=32&width=32", class: "Grade 9A", present: 75, absent: 11, late: 6, percentage: 87, status: "good" },
  { id: 4, student: "Emily Davis", studentId: "STU004", avatar: "/placeholder.svg?height=32&width=32", class: "Grade 11A", present: 85, absent: 1, late: 1, percentage: 99, status: "excellent" },
  { id: 5, student: "David Wilson", studentId: "STU005", avatar: "/placeholder.svg?height=32&width=32", class: "Grade 10A", present: 65, absent: 18, late: 9, percentage: 75, status: "warning" },
]

const stats = [
  { label: "Total Students", value: "1,234", icon: Users, color: "bg-primary/10 text-primary" },
  { label: "Present Today", value: "1,156", icon: CheckCircle, color: "bg-green-100 text-green-600" },
  { label: "Absent Today", value: "78", icon: XCircle, color: "bg-red-100 text-red-600" },
  { label: "Attendance Rate", value: "93.7%", icon: Calendar, color: "bg-blue-100 text-blue-600" },
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case "excellent": return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Excellent</Badge>
    case "good": return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Good</Badge>
    case "warning": return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Warning</Badge>
    case "poor": return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Poor</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
}

export default function AttendancePage() {
  const [showMarkForm, setShowMarkForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
            <p className="text-sm text-muted-foreground">Track and manage student attendance</p>
          </div>
          <Button className="gap-2" onClick={() => setShowMarkForm(true)}>
            <Plus className="h-4 w-4" />
            Mark Attendance
          </Button>
        </div>

        <MarkAttendanceForm open={showMarkForm} onOpenChange={setShowMarkForm} onSuccess={() => setRefreshKey(prev => prev + 1)} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-4" key={refreshKey}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="today">Today's Attendance</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search students..." className="pl-10" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  <SelectItem value="10a">Grade 10A</SelectItem>
                  <SelectItem value="10b">Grade 10B</SelectItem>
                  <SelectItem value="9a">Grade 9A</SelectItem>
                  <SelectItem value="11a">Grade 11A</SelectItem>
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
                    <TableHead>Percentage</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceData.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={record.avatar} alt={record.student} />
                            <AvatarFallback>{record.student.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{record.student}</p>
                            <p className="text-xs text-muted-foreground">{record.studentId}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{record.class}</TableCell>
                      <TableCell><span className="text-green-600 font-medium">{record.present}</span></TableCell>
                      <TableCell><span className="text-red-600 font-medium">{record.absent}</span></TableCell>
                      <TableCell><span className="text-yellow-600 font-medium">{record.late}</span></TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Progress value={record.percentage} className="h-2 w-16" />
                            <span className="text-sm font-medium">{record.percentage}%</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="today" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Select defaultValue="10a">
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10a">Grade 10A</SelectItem>
                        <SelectItem value="10b">Grade 10B</SelectItem>
                        <SelectItem value="9a">Grade 9A</SelectItem>
                        <SelectItem value="11a">Grade 11A</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button>Save Attendance</Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Mark attendance for today's classes. Use the "Mark Attendance" button above to record individual attendance.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Start Date</label>
                      <Input type="date" className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">End Date</label>
                      <Input type="date" className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Class</label>
                      <Select defaultValue="all">
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Classes</SelectItem>
                          <SelectItem value="10a">Grade 10A</SelectItem>
                          <SelectItem value="10b">Grade 10B</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button className="gap-2">
                    <Download className="h-4 w-4" />
                    Generate Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
