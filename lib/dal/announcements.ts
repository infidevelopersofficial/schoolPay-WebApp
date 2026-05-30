import { withTenantRead } from "@/lib/dal/core"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { withDAL } from "@/lib/dal/utils"
import { getSchoolId } from "@/lib/tenant-context"
import { logger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"
import { auth } from "@/lib/auth"
import { publishEvent } from "@/lib/events/emitter"


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
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
  return withDAL(
    "announcements.getAll",
    () =>
      prisma.announcement.findMany({
        where: { schoolId, isActive: true },
        orderBy: { createdAt: "desc" },
      }),
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
  })
}

export async function createAnnouncement(input: z.infer<typeof createAnnouncementSchema>) {
  const schoolId = await getSchoolId()
  const validated = createAnnouncementSchema.parse(input)
  
  const announcement = await withDAL(
    "announcements.create",
    () =>
      prisma.announcement.create({
        data: { ...validated, schoolId },
      }),
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )

  // Emit ANNOUNCEMENT_CREATED for each recipient user safely
  try {
    const roles: string[] = []
    if (announcement.targetAudience === "ALL") {
      roles.push("PARENT", "STUDENT")
    } else if (announcement.targetAudience === "PARENTS") {
      roles.push("PARENT")
    } else if (announcement.targetAudience === "STUDENTS") {
      roles.push("STUDENT")
    } else if (announcement.targetAudience === "TEACHERS") {
      roles.push("TEACHER")
    }

    if (roles.length > 0) {
      const recipients = await prisma.userSchool.findMany({
        where: {
          schoolId,
          role: { in: roles as any },
          user: { isActive: true }
        },
        select: { userId: true }
      });

      const session = await auth();
      const authorName = session?.user?.name || announcement.author || "School Administration";

      // Publish event for each user
      for (const recipient of recipients) {
        await publishEvent({
          eventType: "ANNOUNCEMENT_CREATED",
          entityType: "ANNOUNCEMENT",
          entityId: announcement.id,
          schoolId,
          payload: {
            userId: recipient.userId,
            schoolId,
            title: announcement.title,
            content: announcement.content,
            authorName,
            targetAudience: announcement.targetAudience
          }
        });
      }
    }
  } catch (eventErr) {
    console.error("[Non-blocking Error] Failed to publish ANNOUNCEMENT_CREATED events:", eventErr);
  }

  return announcement
}
