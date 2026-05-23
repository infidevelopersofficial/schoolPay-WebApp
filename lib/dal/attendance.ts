import { withTenantRead } from "@/lib/dal/core"
import { prisma as db } from "@/lib/prisma"
import { z } from "zod"
import { recordAuditLog } from "@/lib/audit"
import { withDAL } from "@/lib/dal/utils"
import { getSchoolId } from "@/lib/tenant-context"
import { logger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"
import { AttendanceStatus } from "@prisma/client"
import { publishEvent } from "@/lib/events/emitter"

const log = logger.child({ domain: "attendance" })

export const bulkAttendanceSchema = z.object({
  batchId: z.string().min(1),
  date: z.string().min(1),
  records: z.array(z.object({
    studentId: z.string().min(1),
    status: z.nativeEnum(AttendanceStatus),
    remarks: z.string().optional()
  }))
})

export type BulkAttendanceInput = z.infer<typeof bulkAttendanceSchema>

/**
 * Perform a high-performance bulk upsert of attendance records.
 * Generates events for absentees/late students.
 */
export async function markBulkAttendance(input: BulkAttendanceInput, userId: string, isAdmin = false) {
  const schoolId = await getSchoolId()
  const validated = bulkAttendanceSchema.parse(input)
  const targetDate = new Date(validated.date)

  return withDAL(
    "attendance.bulkMark",
    async () => {
      // 1. Ownership & Locking Check
      const batch = await db.batch.findUnique({
        where: { id: validated.batchId },
        include: { attendanceRegisters: { where: { date: targetDate } } }
      })

      if (!batch || batch.schoolId !== schoolId) {
        throw new Error("Batch not found or unauthorized")
      }

      if (!isAdmin && batch.teacherId !== userId) {
        throw new Error("You are not authorized to mark attendance for this batch")
      }

      const register = batch.attendanceRegisters[0]
      if (register && register.isLocked && !isAdmin) {
        throw new Error("Attendance for this date is locked. Contact an administrator to make changes.")
      }

      // 2. Transactional Upsert & Metrics
      await db.$transaction(async (tx) => {
        let presentCount = 0;
        let absentCount = 0;
        let lateCount = 0;

        for (const record of validated.records) {
          if (record.status === "PRESENT") presentCount++;
          if (record.status === "ABSENT") absentCount++;
          if (record.status === "LATE") lateCount++;

          const existing = await tx.attendance.findUnique({
            where: { studentId_date_schoolId: { studentId: record.studentId, date: targetDate, schoolId } }
          });

          await tx.attendance.upsert({
            where: {
              studentId_date_schoolId: {
                studentId: record.studentId,
                date: targetDate,
                schoolId,
              },
            },
            create: {
              studentId: record.studentId,
              date: targetDate,
              status: record.status,
              remarks: record.remarks,
              batchId: validated.batchId,
              schoolId,
              recordedBy: userId
            },
            update: {
              status: record.status,
              remarks: record.remarks,
              recordedBy: userId
            },
          });

          // Generate granular audit logs and events only if status changed
          if (existing && existing.status !== record.status) {
             await tx.auditLog.create({
               data: {
                 userId,
                 action: "UPDATE",
                 entityType: "ATTENDANCE",
                 entityId: existing.id,
                 oldValues: { status: existing.status },
                 newValues: { status: record.status },
                 description: `Changed status from ${existing.status} to ${record.status}`,
                 schoolId
               }
             })

             if (register?.isLocked) {
                // Corrected after lock!
                await publishEvent({
                  tx,
                  eventType: "ATTENDANCE_CORRECTED",
                  entityType: "ATTENDANCE",
                  entityId: existing.id,
                  schoolId,
                  payload: { studentId: record.studentId, date: validated.date, oldStatus: existing.status, newStatus: record.status }
                })
             }
          }

          // Generate Notification Events for Absences/Late
          if (!existing || existing.status === "NOT_MARKED") {
            if (record.status === "ABSENT") {
              await publishEvent({ tx, eventType: "STUDENT_ABSENT", entityType: "ATTENDANCE", entityId: record.studentId, schoolId, payload: { date: validated.date, batchId: validated.batchId } })
            } else if (record.status === "LATE") {
              await publishEvent({ tx, eventType: "STUDENT_LATE", entityType: "ATTENDANCE", entityId: record.studentId, schoolId, payload: { date: validated.date, batchId: validated.batchId } })
            }
          }
        }

        // 3. Update Register Snapshot
        await tx.attendanceRegister.upsert({
          where: { batchId_date_schoolId: { batchId: validated.batchId, date: targetDate, schoolId } },
          create: {
            batchId: validated.batchId,
            date: targetDate,
            schoolId,
            status: "SUBMITTED",
            totalStudents: validated.records.length,
            presentCount,
            absentCount,
            lateCount,
            submittedBy: userId,
            submittedAt: new Date()
          },
          update: {
            status: register?.status === "LOCKED" ? "LOCKED" : "SUBMITTED",
            totalStudents: validated.records.length,
            presentCount,
            absentCount,
            lateCount,
            submittedBy: userId,
            submittedAt: new Date()
          }
        });
      });

      return { success: true, count: validated.records.length }
    },
    { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY }
  )
}

export async function lockAttendanceRegister(batchId: string, date: string, userId: string, isAdmin = false, lockReason?: string) {
  const schoolId = await getSchoolId()
  const targetDate = new Date(date)

  return withDAL("attendance.lock", async () => {
    const batch = await db.batch.findUnique({ where: { id: batchId } })
    if (!batch || batch.schoolId !== schoolId) throw new Error("Batch not found")
    if (!isAdmin && batch.teacherId !== userId) throw new Error("Unauthorized")

    const register = await db.attendanceRegister.findUnique({
      where: { batchId_date_schoolId: { batchId, date: targetDate, schoolId } }
    })

    if (!register) throw new Error("Cannot lock unsubmitted attendance")

    await db.$transaction(async (tx) => {
      await tx.attendanceRegister.update({
        where: { id: register.id },
        data: {
          isLocked: true,
          status: "LOCKED",
          lockedBy: userId,
          lockedAt: new Date(),
          lockReason
        }
      });

      await publishEvent({
        tx,
        eventType: "ATTENDANCE_SUBMITTED",
        entityType: "ATTENDANCE_REGISTER",
        entityId: register.id,
        schoolId,
        payload: { batchId, date }
      })
    });

    return { success: true }
  }, { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY })
}

export async function getAttendanceRegister(batchId: string, date: string) {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
    return db.attendanceRegister.findUnique({
      where: { batchId_date_schoolId: { batchId, date: new Date(date), schoolId } }
    })
  })
}

export async function getStudentAttendanceStats(studentId: string) {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
    const student = await db.student.findUnique({ where: { id: studentId } })
    if (!student || student.schoolId !== schoolId) throw new Error("Student not found")

    const records = await db.attendance.findMany({
      where: { studentId, schoolId }
    })

    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    for (const r of records) {
      if (r.status === "PRESENT") present++;
      if (r.status === "ABSENT") absent++;
      if (r.status === "LATE") late++;
      if (r.status === "EXCUSED") excused++;
    }

    const totalDays = records.filter(r => r.status !== "NOT_MARKED" && r.status !== "HOLIDAY").length
    const attendancePercentage = totalDays > 0 ? ((present + late) / totalDays) * 100 : 0;

    return {
      attendancePercentage: Math.round(attendancePercentage * 10) / 10,
      presentDays: present,
      absentDays: absent,
      lateDays: late,
      excusedDays: excused,
      totalWorkingDays: totalDays
    }
  })
}
