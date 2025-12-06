import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const lessons = [
  { id: 1, title: "Algebra Basics", subject: "Mathematics", class: "Grade 9A", date: "2025-01-15", completed: true },
  {
    id: 2,
    title: "Shakespeare's Sonnets",
    subject: "English",
    class: "Grade 10B",
    date: "2025-01-16",
    completed: false,
  },
  { id: 3, title: "Cell Biology", subject: "Science", class: "Grade 9B", date: "2025-01-17", completed: true },
  { id: 4, title: "World War II", subject: "History", class: "Grade 11A", date: "2025-01-18", completed: false },
]

export default function LessonsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Lessons</h1>
            <p className="text-sm text-muted-foreground">Manage and schedule lessons</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Lesson
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search lessons..." className="pl-10" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lessons.map((lesson) => (
            <Card key={lesson.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{lesson.title}</CardTitle>
                  <Badge variant={lesson.completed ? "default" : "secondary"}>
                    {lesson.completed ? "Completed" : "Pending"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Subject:</span> {lesson.subject}
                </p>
                <p>
                  <span className="text-muted-foreground">Class:</span> {lesson.class}
                </p>
                <p>
                  <span className="text-muted-foreground">Date:</span> {lesson.date}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
