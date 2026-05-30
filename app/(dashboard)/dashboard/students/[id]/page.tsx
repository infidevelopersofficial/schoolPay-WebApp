import { prisma } from "@/lib/prisma"
import { getSchoolId } from "@/lib/tenant-context"
import { notFound } from "next/navigation"
import { PortalAccessCard } from "./portal-access"
import { getStudentAttendanceStats } from "@/lib/dal/attendance"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const schoolId = await getSchoolId()
  if (!schoolId) notFound()

  const student = await prisma.student.findUnique({
    where: { id: params.id, schoolId },
    include: { 
      user: true,
      attendance: {
        orderBy: { date: "desc" },
        take: 10
      }
    }
  })

  if (!student) notFound()

  const stats = await getStudentAttendanceStats(student.id)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{student.name}</h1>
      <p className="text-muted-foreground">Admission No: {student.admissionNumber}</p>

      <div className="grid gap-6 md:grid-cols-2">
        <PortalAccessCard student={student} />
        
        <Card>
          <CardHeader>
            <CardTitle>Attendance Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Attendance Percentage</span>
              <span className="text-2xl font-bold">{stats.attendancePercentage}%</span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Present</p>
                <p className="font-semibold">{stats.presentDays}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Absent</p>
                <p className="font-semibold">{stats.absentDays}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Late</p>
                <p className="font-semibold">{stats.lateDays}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Working Days</p>
                <p className="font-semibold">{stats.totalWorkingDays}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          {student.attendance && student.attendance.length > 0 ? (
            <div className="space-y-2">
              {student.attendance.map((record: any) => (
                <div key={record.id} className="flex justify-between border-b pb-2">
                  <span>{new Date(record.date).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
                  <span className={`font-semibold ${record.status === "PRESENT" ? "text-green-600" : record.status === "ABSENT" ? "text-red-600" : "text-amber-600"}`}>
                    {record.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No recent attendance records.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
