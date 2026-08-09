import { withTenantRead } from "@/lib/dal/core"
import { prisma } from "@/lib/prisma"
import { LessonStatus } from "@prisma/client"
import { z } from "zod"
import { withDAL } from "@/lib/dal/utils"
import { getSchoolId } from "@/lib/tenant-context"
import { logger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"

const log = logger.child({ domain: "lessons" })

export const createLessonSchema = z.object({
  title: z.string().min(1),
  subject: z.string().min(1),
  class: z.string().min(1),
  teacherId: z.string().optional(),
  date: z.string().min(1),
  time: z.string().optional(),
  duration: z.string().min(1),
  description: z.string().optional(),
  status: z.string().optional(),
})

export async function getLessons() {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
    return withDAL(
      "lessons.getAll",
      () =>
        prisma.lesson.findMany({
          where: { schoolId, status: { not: "CANCELLED" } },
          orderBy: { createdAt: "desc" },
          include: { teacher: { select: { name: true } } },
        }),
      { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
    )
  })
}

export async function getLesson(id: string) {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
    return withDAL(
      "lessons.getOne",
      () => prisma.lesson.findUnique({ where: { id } }).then((l) => {
        if (l && l.schoolId !== schoolId) return null
        return l
      }),
      { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
    )
  })
}

export async function createLesson(input: z.infer<typeof createLessonSchema>) {
  const schoolId = await getSchoolId()
  const validated = createLessonSchema.parse(input)
  return withDAL(
    "lessons.create",
    async () => {
      if (validated.teacherId && validated.date && validated.time) {
        const conflict = await prisma.lesson.findFirst({
          where: {
            schoolId,
            teacherId: validated.teacherId,
            date: validated.date,
            time: validated.time,
            status: { not: "CANCELLED" },
          },
        })
        if (conflict) {
          throw new Error(`Schedule conflict: Teacher already has a lesson ("${conflict.title}") at ${validated.time} on ${validated.date}`)
        }
      }

      return prisma.lesson.create({
        data: { ...validated, schoolId, status: "SCHEDULED" as any },
      })
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function updateLesson(id: string, input: Partial<z.infer<typeof createLessonSchema>>) {
  const schoolId = await getSchoolId()
  return withDAL(
    "lessons.update",
    async () => {
      const existing = await prisma.lesson.findUnique({ where: { id } })
      if (!existing || existing.schoolId !== schoolId) {
        throw new Error("Lesson not found")
      }

      const mergedTeacherId = input.teacherId !== undefined ? input.teacherId : existing.teacherId
      const mergedDate = input.date !== undefined ? input.date : existing.date
      const mergedTime = input.time !== undefined ? input.time : existing.time
      const mergedStatus = input.status !== undefined ? input.status : existing.status

      if (mergedTeacherId && mergedDate && mergedTime && mergedStatus !== "CANCELLED") {
        const conflict = await prisma.lesson.findFirst({
          where: {
            id: { not: id },
            schoolId,
            teacherId: mergedTeacherId,
            date: mergedDate,
            time: mergedTime,
            status: { not: "CANCELLED" },
          },
        })
        if (conflict) {
          throw new Error(`Schedule conflict: Teacher already has a lesson ("${conflict.title}") at ${mergedTime} on ${mergedDate}`)
        }
      }

      const { status, ...rest } = input

      return prisma.lesson.update({
        where: { id },
        data: {
          ...rest,
          ...(status ? { status: status as LessonStatus } : {})
        },
      })
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function deleteLesson(id: string) {
  const schoolId = await getSchoolId()
  return withDAL(
    "lessons.delete",
    async () => {
      const existing = await prisma.lesson.findUnique({ where: { id } })
      if (!existing || existing.schoolId !== schoolId) {
        throw new Error("Lesson not found or unauthorized")
      }

      return prisma.lesson.update({
        where: { id },
        data: { status: "CANCELLED" },
      })
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}
