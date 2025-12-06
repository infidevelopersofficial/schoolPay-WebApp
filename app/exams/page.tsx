import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const exams = [
  { id: 1, name: "Math Midterm", class: "Grade 9", date: "2025-02-10", maxMarks: 100, status: "scheduled" },
  { id: 2, name: "English Finals", class: "Grade 10", date: "2025-02-15", maxMarks: 80, status: "scheduled" },
  { id: 3, name: "Science Practical", class: "Grade 11", date: "2025-02-20", maxMarks: 50, status: "scheduled" },
]

export default function ExamsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Examinations</h1>
            <p className="text-sm text-muted-foreground">Schedule and manage exams</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Exam
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search exams..." className="pl-10" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map((exam) => (
            <Card key={exam.id}>
              <CardHeader>
                <CardTitle className="text-base">{exam.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Class:</span> {exam.class}
                </p>
                <p>
                  <span className="text-muted-foreground">Date:</span> {exam.date}
                </p>
                <p>
                  <span className="text-muted-foreground">Max Marks:</span> {exam.maxMarks}
                </p>
                <Badge className="w-fit bg-green-100 text-green-700">{exam.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
