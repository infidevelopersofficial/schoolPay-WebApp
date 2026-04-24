import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { recordAuditLog } from "@/lib/audit"
import { withDAL } from "@/lib/dal/utils"
import { getSchoolId } from "@/lib/tenant-context"
import { logger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"

const log = logger.child({ domain: "exams" })

export const createExamSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  class: z.string().min(1),
  date: z.string().min(1),
  time: z.string().optional(),
  duration: z.string().min(1),
  maxMarks: z.coerce.number().positive(),
  venue: z.string().optional(),
  description: z.string().optional(),
  teacherId: z.string().optional(),
})

export async function getExams() {
  const schoolId = await getSchoolId()
  return withDAL(
    "exams.getAll",
    () =>
      prisma.exam.findMany({
        where: { schoolId },
        orderBy: { createdAt: "desc" },
        include: {
          teacher: { select: { name: true } },
          _count: { select: { results: true } },
        },
      }),
    { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
  )
}

export async function createExam(input: z.infer<typeof createExamSchema>) {
  const schoolId = await getSchoolId()
  const validated = createExamSchema.parse(input)
  return withDAL(
    "exams.create",
    async () => {
      const exam = await prisma.exam.create({
        data: { ...validated, schoolId, status: "SCHEDULED" },
      })

      await recordAuditLog({
        action: "CREATE",
        entityType: "EXAM",
        entityId: exam.id,
        schoolId,
        newValues: validated,
        description: `Scheduled exam: ${exam.name} for class ${exam.class}`,
      })

      return exam
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}
