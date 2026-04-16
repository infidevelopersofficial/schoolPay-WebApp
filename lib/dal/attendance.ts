import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { recordAuditLog } from "@/lib/audit"
import { withDAL } from "@/lib/dal/utils"
import { logger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"

const log = logger.child({ domain: "attendance" })

export const markAttendanceSchema = z.object({
  studentId: z.string().min(1),
  date: z.string().min(1),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
  remarks: z.string().optional(),
})

export async function getAttendance(opts?: {
  studentId?: string
  date?: string
  classFilter?: string
}) {
  const { studentId, date } = opts ?? {}
  const where = {
    ...(studentId && { studentId }),
    ...(date && { date: new Date(date) }),
  }
  return withDAL(
    "attendance.getAll",
    () =>
      prisma.attendance.findMany({
        where,
        orderBy: { date: "desc" },
        include: { student: { select: { name: true, class: true } } },
      }),
    { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
  )
}

export async function markAttendance(input: z.infer<typeof markAttendanceSchema>) {
  const validated = markAttendanceSchema.parse(input)
  return withDAL(
    "attendance.mark",
    async () => {
      const record = await prisma.attendance.upsert({
        where: {
          studentId_date: { studentId: validated.studentId, date: new Date(validated.date) },
        },
        create: { ...validated, date: new Date(validated.date) },
        update: { status: validated.status, remarks: validated.remarks },
      })

      await recordAuditLog({
        action: "UPDATE",
        entityType: "ATTENDANCE",
        entityId: record.id,
        newValues: { status: validated.status, date: validated.date },
        description: `Marked attendance for student ${validated.studentId}: ${validated.status}`,
      })

      return record
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}
