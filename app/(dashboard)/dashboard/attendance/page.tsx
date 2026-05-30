import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getSchoolId } from "@/lib/tenant-context"
import { AttendanceGrid } from "@/components/attendance/AttendanceGrid"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: { batchId?: string; date?: string }
}) {
  const session = await auth()
  if (!session?.user) return null

  const schoolId = await getSchoolId()
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN"
  
  // Default to today
  const targetDateStr = searchParams.date || format(new Date(), "yyyy-MM-dd")
  const targetDate = new Date(targetDateStr)

  // Fetch batches available to the user
  const batches = await prisma.batch.findMany({
    where: {
      schoolId,
      isActive: true,
      ...(isAdmin ? {} : { teacherId: session.user.id }) // RBAC Enforced
    },
    orderBy: { name: "asc" }
  })

  const selectedBatchId = searchParams.batchId || (batches.length > 0 ? batches[0].id : null)

  let students: any[] = []
  let existingRecords: Record<string, any> = {}
  let isLocked = false

  if (selectedBatchId) {
    const enrollments = await prisma.enrollment.findMany({
      where: { batchId: selectedBatchId, status: "ACTIVE" },
      include: { student: { select: { id: true, name: true, rollNumber: true } } },
      orderBy: { student: { name: "asc" } }
    })

    students = enrollments.map(e => e.student)

    const attendanceRecords = await prisma.attendance.findMany({
      where: { batchId: selectedBatchId, date: targetDate, schoolId }
    })

    attendanceRecords.forEach(r => {
      existingRecords[r.studentId] = { status: r.status, remarks: r.remarks }
    })

    const register = await prisma.attendanceRegister.findUnique({
      where: { batchId_date_schoolId: { batchId: selectedBatchId, date: targetDate, schoolId } }
    })

    if (register?.isLocked) {
      isLocked = true
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground">Manage daily attendance for your assigned classes.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Select Date</label>
              <input 
                type="date" 
                name="date" 
                defaultValue={targetDateStr} 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
              />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Select Class/Batch</label>
              <select 
                name="batchId" 
                defaultValue={selectedBatchId || ""}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {batches.length === 0 && <option value="" disabled>No assigned batches found</option>}
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none">
              Load Register
            </button>
          </form>
        </CardContent>
      </Card>

      {selectedBatchId ? (
        <AttendanceGrid 
          batchId={selectedBatchId} 
          date={targetDateStr}
          students={students}
          existingRecords={existingRecords}
          isLocked={isLocked}
          isAdmin={isAdmin}
        />
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Please select a class/batch to load the attendance register.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
