import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { withDAL } from "@/lib/dal/utils"
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
})

export async function getLessons() {
  return withDAL(
    "lessons.getAll",
    () =>
      prisma.lesson.findMany({
        orderBy: { createdAt: "desc" },
        include: { teacher: { select: { name: true } } },
      }),
    { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
  )
}

export async function createLesson(input: z.infer<typeof createLessonSchema>) {
  const validated = createLessonSchema.parse(input)
  return withDAL(
    "lessons.create",
    () => prisma.lesson.create({ data: { ...validated, status: "SCHEDULED" } }),
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}
