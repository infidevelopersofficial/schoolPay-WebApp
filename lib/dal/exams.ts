import { withTenantRead } from "@/lib/dal/core"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { recordAuditLog } from "@/lib/audit"
import { withDAL } from "@/lib/dal/utils"
import { getSchoolId } from "@/lib/tenant-context"
import { logger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"

const log = logger.child({ domain: "exams" })

// ==========================================
// Exam Group Schemas & DAL
// ==========================================

export const createExamGroupSchema = z.object({
  name: z.string().min(1),
  sessionId: z.string().min(1),
  gradingSchemeId: z.string().optional(),
})

export async function getExamGroups(sessionId?: string) {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
    return withDAL(
      "exams.getGroups",
      () =>
        prisma.examGroup.findMany({
          where: { 
            schoolId,
            ...(sessionId ? { sessionId } : {})
          },
          orderBy: { createdAt: "desc" },
          include: {
            gradingScheme: true,
            _count: { select: { exams: true } }
          },
        }),
      { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
    )
  })
}

export async function getExamGroupById(id: string) {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
    return withDAL(
      "exams.getGroupById",
      () =>
        prisma.examGroup.findUnique({
          where: { id, schoolId },
          include: {
            gradingScheme: true,
            exams: {
              include: {
                batch: true,
                subject: true,
                teacher: { select: { name: true } },
                _count: { select: { results: true } }
              },
              orderBy: { date: 'asc' }
            }
          },
        }),
      { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
    )
  })
}

export async function createExamGroup(input: z.infer<typeof createExamGroupSchema>) {
  const schoolId = await getSchoolId()
  const validated = createExamGroupSchema.parse(input)
  return withDAL(
    "exams.createGroup",
    async () => {
      const group = await prisma.examGroup.create({
        data: { ...validated, schoolId },
      })

      await recordAuditLog({
        action: "CREATE",
        entityType: "EXAM_GROUP",
        entityId: group.id,
        schoolId,
        newValues: validated,
        description: `Created exam group: ${group.name}`,
      })

      return group
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}


// ==========================================
// Exam Schemas & DAL
// ==========================================

export const createExamSchema = z.object({
  name: z.string().min(1),
  examGroupId: z.string().min(1),
  batchId: z.string().min(1),
  subjectId: z.string().min(1),
  sessionId: z.string().min(1),
  date: z.string().min(1),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  maxMarks: z.coerce.number().positive(),
  venue: z.string().optional(),
  description: z.string().optional(),
  teacherId: z.string().optional(),
})

export async function getExams(examGroupId?: string, batchId?: string) {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
    return withDAL(
      "exams.getAll",
      () =>
        prisma.exam.findMany({
          where: { 
            examGroup: { schoolId }, // Tenant isolation
            ...(examGroupId ? { examGroupId } : {}),
            ...(batchId ? { batchId } : {})
          },
          orderBy: { date: "desc" },
          include: {
            examGroup: { select: { name: true } },
            batch: { select: { name: true } },
            subject: { select: { name: true } },
            teacher: { select: { name: true } },
            _count: { select: { results: true } },
          },
        }),
      { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
    )
  })
}

export async function getExamById(id: string) {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
    return withDAL(
      "exams.getById",
      () =>
        prisma.exam.findFirst({
          where: { id, examGroup: { schoolId } }, // Tenant isolation
          include: {
            examGroup: true,
            batch: true,
            subject: true,
            teacher: true,
          },
        }),
      { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
    )
  })
}

export async function createExam(input: z.infer<typeof createExamSchema>) {
  const schoolId = await getSchoolId()
  const validated = createExamSchema.parse(input)
  return withDAL(
    "exams.create",
    async () => {
      // Must verify examGroup belongs to school
      const group = await prisma.examGroup.findUnique({
        where: { id: validated.examGroupId, schoolId }
      });
      if (!group) throw new Error("Exam group not found or belongs to another school")

      const exam = await prisma.exam.create({
        data: { ...validated, schoolId },
      })

      await recordAuditLog({
        action: "CREATE",
        entityType: "EXAM",
        entityId: exam.id,
        schoolId,
        newValues: validated,
        description: `Scheduled exam: ${exam.name}`,
      })

      return exam
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

// Locking controls
export async function toggleExamLock(id: string, marksLocked: boolean) {
  const schoolId = await getSchoolId()
  return withDAL(
    "exams.toggleLock",
    async () => {
      const existing = await prisma.exam.findFirst({
        where: { id, examGroup: { schoolId } }
      })
      if (!existing) throw new Error("Exam not found")

      const exam = await prisma.exam.update({
        where: { id },
        data: { marksLocked }
      })

      await recordAuditLog({
        action: "UPDATE",
        entityType: "EXAM",
        entityId: exam.id,
        schoolId,
        newValues: { marksLocked },
        description: marksLocked ? `Locked marks entry for exam: ${exam.name}` : `Unlocked marks entry for exam: ${exam.name}`,
      })

      return exam
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function toggleExamPublish(id: string, resultsPublished: boolean) {
  const schoolId = await getSchoolId()
  return withDAL(
    "exams.togglePublish",
    async () => {
      const existing = await prisma.exam.findFirst({
        where: { id, examGroup: { schoolId } }
      })
      if (!existing) throw new Error("Exam not found")

      const exam = await prisma.exam.update({
        where: { id },
        data: { resultsPublished }
      })

      await recordAuditLog({
        action: "UPDATE",
        entityType: "EXAM",
        entityId: exam.id,
        schoolId,
        newValues: { resultsPublished },
        description: resultsPublished ? `Published results for exam: ${exam.name}` : `Unpublished results for exam: ${exam.name}`,
      })

      return exam
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}
