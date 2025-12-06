import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const attendanceData = [
  { id: 1, student: "John Smith", class: "Grade 10A", present: 78, absent: 8, percentage: 89 },
  { id: 2, student: "Sarah Johnson", class: "Grade 10B", present: 82, absent: 4, percentage: 95 },
  { id: 3, student: "Michael Brown", class: "Grade 9A", present: 75, absent: 11, percentage: 87 },
  { id: 4, student: "Emily Davis", class: "Grade 11A", present: 85, absent: 1, percentage: 99 },
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

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search attendance..." className="pl-10" />
          </div>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Present</TableHead>
                <TableHead>Absent</TableHead>
                <TableHead>Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceData.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.student}</TableCell>
                  <TableCell>{record.class}</TableCell>
                  <TableCell>{record.present}</TableCell>
                  <TableCell>{record.absent}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        record.percentage >= 90 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }
                    >
                      {record.percentage}%
                    </Badge>
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
