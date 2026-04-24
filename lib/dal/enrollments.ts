import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { withDAL } from "@/lib/dal/utils"
import { getSchoolId } from "@/lib/tenant-context"
import { logger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"

const log = logger.child({ domain: "enrollments" })

export const enrollStudentSchema = z.object({
  studentId: z.string().min(1),
  batchId: z.string().min(1),
  status: z.enum(["ACTIVE", "COMPLETED", "DROPPED", "ON_HOLD"]).default("ACTIVE"),
})

export const updateEnrollmentSchema = z.object({
  status: z.enum(["ACTIVE", "COMPLETED", "DROPPED", "ON_HOLD"]),
})

export async function getEnrollments(opts?: { batchId?: string; studentId?: string; status?: string }) {
  const schoolId = await getSchoolId()
  const { batchId, studentId, status } = opts ?? {}
  return withDAL(
    "enrollments.getAll",
    () =>
      prisma.enrollment.findMany({
        where: {
          schoolId,
          ...(batchId && { batchId }),
          ...(studentId && { studentId }),
          ...(status && { status: status as any }),
        },
        include: {
          student: { select: { id: true, name: true, class: true, feeStatus: true, email: true } },
          batch: { select: { id: true, name: true, grade: true, section: true, subjectFocus: true } },
        },
        orderBy: { enrolledAt: "desc" },
      }),
    { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
  )
}

export async function enrollStudent(input: z.infer<typeof enrollStudentSchema>) {
  const schoolId = await getSchoolId()
  const validated = enrollStudentSchema.parse(input)
  return withDAL(
    "enrollments.create",
    async () => {
      // Verify both student and batch belong to this school
      const [student, batch] = await Promise.all([
        prisma.student.findUnique({ where: { id: validated.studentId }, select: { schoolId: true, name: true } }),
        prisma.batch.findUnique({ where: { id: validated.batchId }, select: { schoolId: true, name: true } }),
      ])

      if (student?.schoolId !== schoolId) throw new Error("Student not found")
      if (batch?.schoolId !== schoolId) throw new Error("Batch not found")

      return prisma.enrollment.create({
        data: { ...validated, schoolId },
        include: {
          student: { select: { name: true } },
          batch: { select: { name: true } },
        },
      })
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function updateEnrollmentStatus(id: string, status: z.infer<typeof updateEnrollmentSchema>["status"]) {
  const schoolId = await getSchoolId()
  return withDAL(
    "enrollments.updateStatus",
    async () => {
      const existing = await prisma.enrollment.findUnique({ where: { id } })
      if (existing?.schoolId !== schoolId) throw new Error("Enrollment not found")

      return prisma.enrollment.update({
        where: { id },
        data: { status },
      })
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function removeEnrollment(id: string) {
  const schoolId = await getSchoolId()
  return withDAL(
    "enrollments.delete",
    async () => {
      const existing = await prisma.enrollment.findUnique({ where: { id } })
      if (existing?.schoolId !== schoolId) throw new Error("Enrollment not found")
      return prisma.enrollment.delete({ where: { id } })
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}
