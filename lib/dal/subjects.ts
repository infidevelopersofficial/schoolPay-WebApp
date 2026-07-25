import { withTenantRead } from "@/lib/dal/core"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { recordAuditLog } from "@/lib/audit"
import { withDAL } from "@/lib/dal/utils"
import { getSchoolId } from "@/lib/tenant-context"
import { logger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"

const log = logger.child({ domain: "subjects" })

export const createSubjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  code: z.string().min(1, "Code is required"),
  teacher: z.string().optional(),
  teacherId: z.string().optional(),
  description: z.string().optional(),
})

export async function getSubjects() {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
  return withDAL(
    "subjects.getAll",
    () =>
      prisma.subject.findMany({
        where: { schoolId },
        orderBy: { name: "asc" },
      }),
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
  })
}

export async function createSubject(input: z.infer<typeof createSubjectSchema>) {
  const schoolId = await getSchoolId()
  const validated = createSubjectSchema.parse(input)
  return withDAL(
    "subjects.create",
    async () => {
      return await prisma.$transaction(async (tx) => {
        const targetTeacherId = validated.teacherId || validated.teacher;
        let teacherName: string | undefined = validated.teacher;
        let resolvedTeacherId: string | undefined;

        if (targetTeacherId) {
          const teacherObj = await tx.teacher.findFirst({
            where: {
              schoolId,
              OR: [
                { id: targetTeacherId },
                { name: { equals: targetTeacherId, mode: "insensitive" } }
              ]
            }
          });
          if (teacherObj) {
            resolvedTeacherId = teacherObj.id;
            teacherName = teacherObj.name;
          }
        }

        const subject = await tx.subject.create({ 
          data: { 
            name: validated.name,
            code: validated.code,
            teacher: teacherName,
            description: validated.description,
            schoolId 
          } 
        })

        if (resolvedTeacherId) {
          await tx.teacherSubject.upsert({
            where: { teacherId_subjectId: { teacherId: resolvedTeacherId, subjectId: subject.id } },
            create: { teacherId: resolvedTeacherId, subjectId: subject.id, schoolId, isActive: true },
            update: { isActive: true, schoolId }
          })
        }

        await recordAuditLog({
          action: "CREATE",
          entityType: "SUBJECT",
          entityId: subject.id,
          schoolId,
          newValues: validated,
          description: `Created subject: ${subject.name} (${subject.code})`,
        }, tx)

        return subject
      })
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}
