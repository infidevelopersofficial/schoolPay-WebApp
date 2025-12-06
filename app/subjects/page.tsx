import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const subjects = [
  { id: "SUB001", name: "Mathematics", code: "MAT101", teacher: "Dr. James Wilson", classes: 4, students: 120 },
  { id: "SUB002", name: "English Literature", code: "ENG101", teacher: "Ms. Sarah Anderson", classes: 3, students: 90 },
  { id: "SUB003", name: "Science", code: "SCI101", teacher: "Mr. Robert Kumar", classes: 4, students: 125 },
  { id: "SUB004", name: "History", code: "HIS101", teacher: "Ms. Emma Davis", classes: 2, students: 65 },
  { id: "SUB005", name: "Computer Science", code: "CS101", teacher: "Mr. Michael Chen", classes: 3, students: 95 },
]

export default function SubjectsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Subjects</h1>
            <p className="text-sm text-muted-foreground">Manage school subjects and curricula</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Subject
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search subjects..." className="pl-10" />
          </div>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Classes</TableHead>
                <TableHead>Students</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell className="font-medium">{subject.name}</TableCell>
                  <TableCell className="font-mono text-sm">{subject.code}</TableCell>
                  <TableCell>{subject.teacher}</TableCell>
                  <TableCell>{subject.classes}</TableCell>
                  <TableCell>{subject.students}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  )
}
