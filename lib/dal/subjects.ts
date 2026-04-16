import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { recordAuditLog } from "@/lib/audit"
import { withDAL } from "@/lib/dal/utils"
import { logger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"

const log = logger.child({ domain: "subjects" })

export const createSubjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  code: z.string().min(1, "Code is required"),
  teacher: z.string().optional(),
  description: z.string().optional(),
})

export async function getSubjects() {
  return withDAL(
    "subjects.getAll",
    () => prisma.subject.findMany({ orderBy: { name: "asc" } }),
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function createSubject(input: z.infer<typeof createSubjectSchema>) {
  const validated = createSubjectSchema.parse(input)
  return withDAL(
    "subjects.create",
    async () => {
      const subject = await prisma.subject.create({ data: validated })

      await recordAuditLog({
        action: "CREATE",
        entityType: "SUBJECT",
        entityId: subject.id,
        newValues: validated,
        description: `Created subject: ${subject.name} (${subject.code})`,
      })

      return subject
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}
