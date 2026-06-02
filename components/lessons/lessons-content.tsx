"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MoreHorizontal } from "lucide-react"

interface Lesson {
  id: string
  title: string
  subject: string
  class: string
  teacherId?: string | null
  teacher?: { name: string } | null
  date: string
  time?: string | null
  duration: string
  status: string
}

const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed": return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Completed</Badge>
    case "scheduled": return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Scheduled</Badge>
    case "cancelled": return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Cancelled</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
}

export function LessonsContent({ lessons }: { lessons: Lesson[] }) {
  if (lessons.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h3 className="mt-4 text-lg font-semibold">No lessons scheduled</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            You don't have any lessons scheduled yet. Click 'Create Lesson' to add one.
          </p>
        </div>
      </div>
    )
  }

  return (
    <Tabs defaultValue="all" className="space-y-4">
      <TabsList>
        <TabsTrigger value="all">All Lessons</TabsTrigger>
        <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
        <TabsTrigger value="completed">Completed</TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="scheduled" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessons.filter((lesson) => lesson.status.toLowerCase() === "scheduled").map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="completed" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessons.filter((lesson) => lesson.status.toLowerCase() === "completed").map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} className="opacity-75" />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  )
}

function LessonCard({ lesson, className = "" }: { lesson: Lesson; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg">{lesson.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{lesson.subject}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
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
          <span className="text-sm font-medium">{lesson.teacher?.name || "-"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{lesson.date}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{lesson.time || "TBD"} ({lesson.duration})</span>
        </div>
        <div className="pt-2">{getStatusBadge(lesson.status)}</div>
      </CardContent>
    </Card>
  )
}
