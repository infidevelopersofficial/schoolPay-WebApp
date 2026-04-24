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
})

export async function getEvents() {
  const schoolId = await getSchoolId()
  return withDAL(
    "events.getAll",
    () =>
      prisma.event.findMany({
        where: { schoolId },
        orderBy: { createdAt: "desc" },
      }),
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
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
