import { withTenantRead } from "@/lib/dal/core"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { recordAuditLog } from "@/lib/audit"
import { withDAL } from "@/lib/dal/utils"
import { getSchoolId } from "@/lib/tenant-context"
import { logger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"
import { DayOfWeek } from "@prisma/client"

const log = logger.child({ domain: "timetable" })

export const createTimetableSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  sessionId: z.string().min(1, "Academic Session is required"),
})

export const upsertTimetablePeriodSchema = z.object({
  timetableId: z.string().min(1, "Timetable ID is required"),
  dayOfWeek: z.nativeEnum(DayOfWeek),
  periodNumber: z.number().int().positive(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid start time format (HH:MM)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid end time format (HH:MM)"),
  subjectId: z.string().optional().nullable(),
  teacherId: z.string().optional().nullable(),
  roomNumber: z.string().optional().nullable(),
})

export async function createTimetable(input: z.infer<typeof createTimetableSchema>) {
  const schoolId = await getSchoolId()
  const validated = createTimetableSchema.parse(input)
  
  return withDAL(
    "timetable.create",
    async () => {
      // Check for existing active timetable
      const existing = await prisma.timetable.findFirst({
        where: {
          schoolId,
          classId: validated.classId,
          sessionId: validated.sessionId,
          isActive: true
        }
      })

      if (existing) {
        throw new Error("An active timetable already exists for this class and session.")
      }

      return await prisma.$transaction(async (tx) => {
        const timetable = await tx.timetable.create({
          data: {
            schoolId,
            classId: validated.classId,
            sessionId: validated.sessionId,
            isActive: true
          }
        })

        await recordAuditLog({
          action: "CREATE",
          entityType: "TIMETABLE",
          entityId: timetable.id,
          schoolId,
          newValues: validated,
          description: `Created new timetable for class ID: ${validated.classId}`,
        }, tx)

        return timetable
      })
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function getTimetable(classId: string, sessionId: string) {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
    
    return withDAL(
      "timetable.getOne",
      () =>
        prisma.timetable.findFirst({
          where: { 
            schoolId, 
            classId, 
            sessionId,
            isActive: true 
          },
          include: {
            periods: {
              include: {
                subject: true,
                teacher: true
              },
              orderBy: [
                { dayOfWeek: "asc" },
                { periodNumber: "asc" }
              ]
            }
          }
        }),
      { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
    )
  })
}

export async function getTimetableById(id: string) {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
    
    return withDAL(
      "timetable.getById",
      () =>
        prisma.timetable.findFirst({
          where: { 
            schoolId, 
            id,
            isActive: true 
          },
          include: {
            class: true,
            session: true,
            periods: {
              include: {
                subject: true,
                teacher: true
              },
              orderBy: [
                { dayOfWeek: "asc" },
                { periodNumber: "asc" }
              ]
            }
          }
        }),
      { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
    )
  })
}

export async function getTimetables() {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
    
    return withDAL(
      "timetable.getAll",
      () =>
        prisma.timetable.findMany({
          where: { 
            schoolId,
            isActive: true
          },
          include: {
            class: {
              select: { name: true, section: true }
            },
            session: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: "desc" }
        }),
      { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
    )
  })
}

export async function upsertTimetablePeriod(input: z.infer<typeof upsertTimetablePeriodSchema>) {
  const schoolId = await getSchoolId()
  const validated = upsertTimetablePeriodSchema.parse(input)
  
  if (validated.startTime >= validated.endTime) {
    throw new Error("End time must be after start time")
  }

  return withDAL(
    "timetable.upsertPeriod",
    async () => {
      return await prisma.$transaction(async (tx) => {
        // Conflict detection: If a teacher is assigned, check if they are double-booked
        if (validated.teacherId) {
          const conflict = await tx.timetablePeriod.findFirst({
            where: {
              schoolId,
              teacherId: validated.teacherId,
              dayOfWeek: validated.dayOfWeek,
              timetableId: { not: validated.timetableId },
              startTime: { lt: validated.endTime },
              endTime: { gt: validated.startTime },
              timetable: { isActive: true } // Only check against active timetables
            },
            include: {
              timetable: {
                include: { class: true }
              }
            }
          })

          if (conflict) {
            throw new Error(`Conflict: Teacher is already scheduled for class ${conflict.timetable.class.name} ${conflict.timetable.class.section} during this time (${conflict.startTime} - ${conflict.endTime})`)
          }
        }

        const period = await tx.timetablePeriod.upsert({
          where: {
            timetableId_dayOfWeek_periodNumber: {
              timetableId: validated.timetableId,
              dayOfWeek: validated.dayOfWeek,
              periodNumber: validated.periodNumber
            }
          },
          create: {
            schoolId,
            timetableId: validated.timetableId,
            dayOfWeek: validated.dayOfWeek,
            periodNumber: validated.periodNumber,
            startTime: validated.startTime,
            endTime: validated.endTime,
            subjectId: validated.subjectId || null,
            teacherId: validated.teacherId || null,
            roomNumber: validated.roomNumber || null
          },
          update: {
            startTime: validated.startTime,
            endTime: validated.endTime,
            subjectId: validated.subjectId || null,
            teacherId: validated.teacherId || null,
            roomNumber: validated.roomNumber || null
          }
        })

        await recordAuditLog({
          action: "UPDATE",
          entityType: "TIMETABLE_PERIOD",
          entityId: period.id,
          schoolId,
          newValues: validated,
          description: `Upserted period ${validated.periodNumber} for timetable ${validated.timetableId}`,
        }, tx)

        return period
      })
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function clearTimetablePeriod(timetableId: string, dayOfWeek: DayOfWeek, periodNumber: number) {
  const schoolId = await getSchoolId()
  
  return withDAL(
    "timetable.clearPeriod",
    async () => {
      return await prisma.$transaction(async (tx) => {
        // Using deleteMany to avoid throwing if it doesn't exist, though we could use delete if we check first
        const result = await tx.timetablePeriod.deleteMany({
          where: {
            schoolId,
            timetableId,
            dayOfWeek,
            periodNumber
          }
        })

        if (result.count > 0) {
          await recordAuditLog({
            action: "DELETE",
            entityType: "TIMETABLE_PERIOD",
            entityId: `${timetableId}-${dayOfWeek}-${periodNumber}`,
            schoolId,
            description: `Cleared period ${periodNumber} on ${dayOfWeek} for timetable ${timetableId}`,
          }, tx)
        }

        return { success: true, count: result.count }
      })
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function deleteTimetable(id: string) {
  const schoolId = await getSchoolId()
  
  return withDAL(
    "timetable.delete",
    async () => {
      return await prisma.$transaction(async (tx) => {
        const timetable = await tx.timetable.findUnique({ where: { id } })
        
        if (!timetable || timetable.schoolId !== schoolId) {
          throw new Error("Timetable not found or unauthorized")
        }

        const deleted = await tx.timetable.update({
          where: { id },
          data: { isActive: false }
        })

        await recordAuditLog({
          action: "DELETE",
          entityType: "TIMETABLE",
          entityId: id,
          schoolId,
          description: `Soft deleted timetable ${id}`,
        }, tx)

        return deleted
      })
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}
