import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { recordAuditLog } from "@/lib/audit"
import { withDAL } from "@/lib/dal/utils"
import { getSchoolId } from "@/lib/tenant-context"
import { logger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"

const log = logger.child({ domain: "results" })

export const uploadResultSchema = z.object({
  studentId: z.string().min(1),
  examId: z.string().optional(),
  examName: z.string().min(1),
  marks: z.coerce.number().min(0),
  maxMarks: z.coerce.number().positive(),
  grade: z.string().min(1),
  remarks: z.string().optional(),
})

export async function getResults(opts?: { studentId?: string; examId?: string }) {
  const schoolId = await getSchoolId()
  const { studentId, examId } = opts ?? {}
  return withDAL(
    "results.getAll",
    () =>
      prisma.result.findMany({
        where: {
          schoolId,
          ...(studentId && { studentId }),
          ...(examId && { examId }),
        },
        orderBy: { createdAt: "desc" },
        include: {
          student: { select: { name: true, class: true } },
          exam: { select: { name: true, subject: true } },
        },
      }),
    { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
  )
}

export async function uploadResult(input: z.infer<typeof uploadResultSchema>) {
  const schoolId = await getSchoolId()
  const validated = uploadResultSchema.parse(input)
  const percentage = (validated.marks / validated.maxMarks) * 100

  return withDAL(
    "results.upload",
    async () => {
      const result = await prisma.result.create({
        data: { ...validated, schoolId, percentage, status: "PUBLISHED" },
      })

      await recordAuditLog({
        action: "CREATE",
        entityType: "RESULT",
        entityId: result.id,
        schoolId,
        newValues: { ...validated, percentage },
        description: `Published result for student ${validated.studentId}: ${validated.grade} (${percentage.toFixed(1)}%)`,
      })

      return result
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}
