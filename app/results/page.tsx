import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const results = [
  { id: 1, student: "John Smith", class: "Grade 10A", exam: "Math Midterm", marks: 92, maxMarks: 100, grade: "A+" },
  { id: 2, student: "Sarah Johnson", class: "Grade 10B", exam: "English Finals", marks: 78, maxMarks: 80, grade: "A" },
  { id: 3, student: "Michael Brown", class: "Grade 9A", exam: "Science Test", marks: 65, maxMarks: 100, grade: "B" },
  { id: 4, student: "Emily Davis", class: "Grade 11A", exam: "History Exam", marks: 55, maxMarks: 100, grade: "C" },
]

export default function ResultsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Results</h1>
          <p className="text-sm text-muted-foreground">View and publish exam results</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search results..." className="pl-10" />
          </div>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Exam</TableHead>
                <TableHead>Marks</TableHead>
                <TableHead>Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result) => (
                <TableRow key={result.id}>
                  <TableCell className="font-medium">{result.student}</TableCell>
                  <TableCell>{result.class}</TableCell>
                  <TableCell>{result.exam}</TableCell>
                  <TableCell>
                    {result.marks}/{result.maxMarks}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-700">{result.grade}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  )
}
