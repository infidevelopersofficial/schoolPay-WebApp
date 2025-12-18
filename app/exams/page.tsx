"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter, MoreHorizontal, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScheduleExamForm } from "@/components/forms"

const exams = [
  { id: "EXM001", name: "Mathematics Midterm", subject: "Mathematics", class: "Grade 9", date: "2025-02-10", time: "09:00 AM", duration: "2 hours", maxMarks: 100, status: "scheduled" },
  { id: "EXM002", name: "English Finals", subject: "English", class: "Grade 10", date: "2025-02-15", time: "10:00 AM", duration: "2.5 hours", maxMarks: 100, status: "scheduled" },
  { id: "EXM003", name: "Science Practical", subject: "Science", class: "Grade 11", date: "2025-02-20", time: "02:00 PM", duration: "3 hours", maxMarks: 50, status: "scheduled" },
  { id: "EXM004", name: "History Quiz", subject: "History", class: "Grade 9", date: "2025-01-05", time: "11:00 AM", duration: "1 hour", maxMarks: 50, status: "completed" },
  { id: "EXM005", name: "Computer Science Project", subject: "Computer Science", class: "Grade 12", date: "2025-01-10", time: "09:00 AM", duration: "4 hours", maxMarks: 100, status: "completed" },
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case "scheduled": return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Scheduled</Badge>
    case "completed": return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Completed</Badge>
    case "cancelled": return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Cancelled</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
}

export default function ExamsPage() {
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Exams</h1>
            <p className="text-sm text-muted-foreground">Schedule and manage examinations</p>
          </div>
          <Button className="gap-2" onClick={() => setShowScheduleForm(true)}>
            <Plus className="h-4 w-4" />
            Schedule Exam
          </Button>
        </div>

        <ScheduleExamForm open={showScheduleForm} onOpenChange={setShowScheduleForm} onSuccess={() => setRefreshKey(prev => prev + 1)} />

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search exams..." className="pl-10" />
          </div>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        <Tabs defaultValue="all" className="space-y-4" key={refreshKey}>
          <TabsList>
            <TabsTrigger value="all">All Exams</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam ID</TableHead>
                    <TableHead>Exam Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Max Marks</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-mono text-sm">{exam.id}</TableCell>
                      <TableCell className="font-medium">{exam.name}</TableCell>
                      <TableCell>{exam.subject}</TableCell>
                      <TableCell>{exam.class}</TableCell>
                      <TableCell>{exam.date}</TableCell>
                      <TableCell>{exam.time}</TableCell>
                      <TableCell>{exam.duration}</TableCell>
                      <TableCell>{exam.maxMarks}</TableCell>
                      <TableCell>{getStatusBadge(exam.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Download Schedule</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">Cancel Exam</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="upcoming">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.filter((exam) => exam.status === "scheduled").map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">{exam.name}</TableCell>
                      <TableCell>{exam.subject}</TableCell>
                      <TableCell>{exam.class}</TableCell>
                      <TableCell>{exam.date}</TableCell>
                      <TableCell>{exam.time}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Max Marks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.filter((exam) => exam.status === "completed").map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">{exam.name}</TableCell>
                      <TableCell>{exam.subject}</TableCell>
                      <TableCell>{exam.date}</TableCell>
                      <TableCell>{exam.maxMarks}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
