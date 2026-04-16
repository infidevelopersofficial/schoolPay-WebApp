import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { withDAL } from "@/lib/dal/utils"
import { logger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"

const log = logger.child({ domain: "announcements" })

export const createAnnouncementSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  date: z.string().min(1),
  author: z.string().min(1),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  category: z.enum(["GENERAL", "ACADEMIC", "EVENT", "HOLIDAY", "EXAM", "FEE"]),
  targetAudience: z.enum(["ALL", "STUDENTS", "TEACHERS", "PARENTS"]),
  expiryDate: z.string().optional(),
})

export async function getAnnouncements() {
  return withDAL(
    "announcements.getAll",
    () =>
      prisma.announcement.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      }),
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function createAnnouncement(input: z.infer<typeof createAnnouncementSchema>) {
  const validated = createAnnouncementSchema.parse(input)
  return withDAL(
    "announcements.create",
    () => prisma.announcement.create({ data: validated }),
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}
