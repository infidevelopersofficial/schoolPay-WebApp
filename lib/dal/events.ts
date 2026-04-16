import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { withDAL } from "@/lib/dal/utils"
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
  return withDAL(
    "events.getAll",
    () => prisma.event.findMany({ orderBy: { createdAt: "desc" } }),
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function createEvent(input: z.infer<typeof createEventSchema>) {
  const validated = createEventSchema.parse(input)
  return withDAL(
    "events.create",
    () => prisma.event.create({ data: { ...validated, status: "UPCOMING" } }),
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}
