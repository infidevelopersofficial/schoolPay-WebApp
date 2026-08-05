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
        include: { teacherSubjects: { include: { teacher: true }, where: { isActive: true } } },
      }),
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
  })
}

export async function getSubject(id: string) {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
    return withDAL(
      "subjects.getOne",
      () =>
        prisma.subject.findUnique({
          where: { id },
          include: { teacherSubjects: { include: { teacher: true }, where: { isActive: true } } },
        }).then((subject) => {
          if (subject && subject.schoolId !== schoolId) return null
          return subject
        }),
      { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
    )
  })
}

export async function getSubjectDetail(id: string) {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
    return withDAL(
      "subjects.getDetail",
      async () => {
        const subject = await prisma.subject.findUnique({
          where: { id },
          include: { 
            teacherSubjects: { include: { teacher: { select: { id: true, name: true } } }, where: { isActive: true } },
            exams: { take: 5, orderBy: { createdAt: "desc" } }
          },
        })

        if (!subject || subject.schoolId !== schoolId) return null

        // NOTE: Lessons are matched to subjects via string comparison on Lesson.subject
        // rather than a strict FK relation. This will silently return zero results if naming is inconsistent.
        // Future migration should add a proper subjectId FK.
        const lessons = await prisma.lesson.findMany({
          where: {
            schoolId,
            subject: subject.name,
            status: "SCHEDULED"
          },
          orderBy: [{ date: "asc" }, { time: "asc" }],
          take: 5
        })

        return { ...subject, lessons }
      },
      { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
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

export async function updateSubject(id: string, data: Partial<z.infer<typeof createSubjectSchema>>) {
  const schoolId = await getSchoolId()
  return withDAL(
    "subjects.update",
    async () => {
      const oldData = await prisma.subject.findUnique({ where: { id } })
      if (oldData?.schoolId !== schoolId) throw new Error("Subject not found")

      return await prisma.$transaction(async (tx) => {
        const { teacherId, teacher, ...rest } = data;

        const subject = await tx.subject.update({
          where: { id },
          data: rest
        });

        const targetTeacherId = teacherId || teacher;
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
          if (teacherObj) resolvedTeacherId = teacherObj.id;
        }

        // Unlink old teachers
        await tx.teacherSubject.updateMany({
          where: { subjectId: id, schoolId },
          data: { isActive: false }
        });

        if (resolvedTeacherId) {
          await tx.teacherSubject.upsert({
            where: { teacherId_subjectId: { teacherId: resolvedTeacherId, subjectId: id } },
            create: { teacherId: resolvedTeacherId, subjectId: id, schoolId, isActive: true },
            update: { isActive: true, schoolId }
          });
        }

        await recordAuditLog({
          action: "UPDATE",
          entityType: "SUBJECT",
          entityId: id,
          schoolId,
          oldValues: { name: oldData?.name, code: oldData?.code },
          newValues: { name: subject.name, code: subject.code },
          description: `Updated subject: ${subject.name}`,
        }, tx);

        return subject;
      });
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}
