"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter, Calendar, Clock, MoreHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CreateLessonForm } from "@/components/forms"

const lessons = [
  { id: 1, title: "Algebra Basics", subject: "Mathematics", class: "Grade 9A", teacher: "Dr. James Wilson", date: "2025-01-15", time: "09:00 AM", duration: "45 min", status: "completed" },
  { id: 2, title: "Shakespeare's Sonnets", subject: "English", class: "Grade 10B", teacher: "Ms. Sarah Anderson", date: "2025-01-16", time: "10:30 AM", duration: "50 min", status: "scheduled" },
  { id: 3, title: "Cell Biology", subject: "Science", class: "Grade 9B", teacher: "Mr. Robert Kumar", date: "2025-01-17", time: "11:00 AM", duration: "45 min", status: "completed" },
  { id: 4, title: "World War II", subject: "History", class: "Grade 11A", teacher: "Ms. Emma Davis", date: "2025-01-18", time: "02:00 PM", duration: "60 min", status: "scheduled" },
  { id: 5, title: "Python Programming", subject: "Computer Science", class: "Grade 10A", teacher: "Mr. Michael Chen", date: "2025-01-19", time: "09:30 AM", duration: "90 min", status: "scheduled" },
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed": return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Completed</Badge>
    case "scheduled": return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Scheduled</Badge>
    case "cancelled": return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Cancelled</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
}

export default function LessonsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Lessons</h1>
            <p className="text-sm text-muted-foreground">Manage lesson plans and schedules</p>
          </div>
          <Button className="gap-2" onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4" />
            Create Lesson
          </Button>
        </div>

        <CreateLessonForm open={showCreateForm} onOpenChange={setShowCreateForm} onSuccess={() => setRefreshKey(prev => prev + 1)} />

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search lessons..." className="pl-10" />
          </div>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        <Tabs defaultValue="all" className="space-y-4" key={refreshKey}>
          <TabsList>
            <TabsTrigger value="all">All Lessons</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lessons.map((lesson) => (
                <Card key={lesson.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg">{lesson.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{lesson.subject}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Edit Lesson</DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Cancel Lesson</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Class</span>
                      <Badge variant="outline">{lesson.class}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Teacher</span>
                      <span className="text-sm font-medium">{lesson.teacher}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{lesson.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{lesson.time} ({lesson.duration})</span>
                    </div>
                    <div className="pt-2">{getStatusBadge(lesson.status)}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lessons.filter((lesson) => lesson.status === "scheduled").map((lesson) => (
                <Card key={lesson.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{lesson.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{lesson.subject}</p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{lesson.date} at {lesson.time}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lessons.filter((lesson) => lesson.status === "completed").map((lesson) => (
                <Card key={lesson.id} className="opacity-75">
                  <CardHeader>
                    <CardTitle className="text-lg">{lesson.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{lesson.subject}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{lesson.date}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
