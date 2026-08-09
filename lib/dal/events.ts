import { withTenantRead } from "@/lib/dal/core"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { withDAL } from "@/lib/dal/utils"
import { getSchoolId } from "@/lib/tenant-context"
import { logger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"

const log = logger.child({ domain: "events" })

export const createEventSchema = z.object({
  name: z.string().min(1),
  date: z.string().min(1),
  time: z.string().optional(),
  location: z.string().min(1),
  type: z.enum(["MEETING", "SPORTS", "ACADEMIC", "CULTURAL", "HOLIDAY", "OTHER"]),
  description: z.string().optional(),
  status: z.enum(["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"]).optional(),
})

export async function getEvents() {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
  return withDAL(
    "events.getAll",
    () =>
      prisma.event.findMany({
        where: { schoolId, status: { not: "CANCELLED" } },
        orderBy: { createdAt: "desc" },
      }),
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
  })
}

export async function getEvent(id: string) {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
    return withDAL(
      "events.getOne",
      () => prisma.event.findUnique({ where: { id } }).then((e) => {
        if (e && e.schoolId !== schoolId) return null
        return e
      }),
      { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
    )
  })
}

export async function createEvent(input: z.infer<typeof createEventSchema>) {
  const schoolId = await getSchoolId()
  const validated = createEventSchema.parse(input)
  return withDAL(
    "events.create",
    () =>
      prisma.event.create({
        data: { ...validated, schoolId, status: "UPCOMING" },
      }),
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function updateEvent(id: string, input: Partial<z.infer<typeof createEventSchema>>) {
  const schoolId = await getSchoolId()
  return withDAL(
    "events.update",
    async () => {
      const existing = await prisma.event.findUnique({ where: { id } })
      if (!existing || existing.schoolId !== schoolId) {
        throw new Error("Event not found")
      }
      return prisma.event.update({
        where: { id },
        data: input,
      })
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function deleteEvent(id: string) {
  const schoolId = await getSchoolId()
  return withDAL(
    "events.delete",
    async () => {
      const existing = await prisma.event.findUnique({ where: { id } })
      if (!existing || existing.schoolId !== schoolId) {
        throw new Error("Event not found or unauthorized")
      }

      return prisma.event.update({
        where: { id },
        data: { status: "CANCELLED" },
      })
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

