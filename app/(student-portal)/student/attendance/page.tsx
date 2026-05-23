import { getMyAttendance } from "@/lib/dal/student-portal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const metadata = {
  title: "My Attendance | SchoolPay",
}

export default async function StudentAttendancePage() {
  const attendanceRecords = await getMyAttendance()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Attendance History</h1>
        <p className="text-muted-foreground">View your daily attendance records.</p>
      </div>

      {attendanceRecords.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
            <p>No attendance records found.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recorded By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {new Date(record.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={record.status === "PRESENT" ? "default" : "destructive"}>
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell>System</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {attendanceRecords.map((record) => (
              <Card key={record.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{new Date(record.date).toLocaleDateString()}</span>
                    <span className="text-xs text-muted-foreground">Recorded by System</span>
                  </div>
                  <Badge variant={record.status === "PRESENT" ? "default" : "destructive"}>
                    {record.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
