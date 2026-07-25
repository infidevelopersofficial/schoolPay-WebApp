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
import { redis } from "@/lib/redis"

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

      // 2. Pre-fetch existing attendance records for the entire batch in 1 query ($O(1)$)
      const studentIds = validated.records.map(r => r.studentId)
      const existingRecords = await db.attendance.findMany({
        where: {
          studentId: { in: studentIds },
          date: targetDate,
          schoolId
        }
      })
      const existingMap = new Map(existingRecords.map(r => [r.studentId, r]))

      // Pre-fetch parent emails for notification alerts in 1 query ($O(1)$)
      const students = await db.student.findMany({
        where: { id: { in: studentIds } },
        select: {
          id: true,
          name: true,
          email: true,
          userId: true,
          parent: { select: { email: true, userId: true } }
        }
      })
      const studentMap = new Map(students.map(s => [s.id, s]))

      let presentCount = 0;
      let absentCount = 0;
      let lateCount = 0;

      const newRecordsToCreate: any[] = []
      const recordsToUpdate: { id: string; status: AttendanceStatus; remarks?: string }[] = []
      const auditLogsToCreate: any[] = []
      const notificationsToCreate: any[] = []
      const postTxEvents: { eventType: string; studentId: string; payload: any }[] = []
      const lowAttendanceCheckIds: string[] = []

      for (const record of validated.records) {
        if (record.status === "PRESENT") presentCount++;
        if (record.status === "ABSENT") absentCount++;
        if (record.status === "LATE") lateCount++;

        const existing = existingMap.get(record.studentId)
        if (!existing) {
          newRecordsToCreate.push({
            studentId: record.studentId,
            date: targetDate,
            status: record.status,
            remarks: record.remarks,
            batchId: validated.batchId,
            schoolId,
            recordedBy: userId
          })
        } else if (existing.status !== record.status || existing.remarks !== record.remarks) {
          recordsToUpdate.push({
            id: existing.id,
            status: record.status,
            remarks: record.remarks
          })
          if (existing.status !== record.status) {
            auditLogsToCreate.push({
              userId,
              action: "UPDATE",
              entityType: "ATTENDANCE",
              entityId: existing.id,
              oldValues: { status: existing.status },
              newValues: { status: record.status },
              description: `Changed status from ${existing.status} to ${record.status}`,
              schoolId
            })
            if (register?.isLocked) {
              postTxEvents.push({
                eventType: "ATTENDANCE_CORRECTED",
                studentId: record.studentId,
                payload: { studentId: record.studentId, date: validated.date, oldStatus: existing.status, newStatus: record.status, attendanceId: existing.id }
              })
            }
          }
        }

        // Check alerts if new or previously unmarked
        if (!existing || existing.status === "NOT_MARKED") {
          if (record.status === "ABSENT") {
            postTxEvents.push({ eventType: "STUDENT_ABSENT", studentId: record.studentId, payload: { date: validated.date, batchId: validated.batchId } })
          } else if (record.status === "LATE") {
            postTxEvents.push({ eventType: "STUDENT_LATE", studentId: record.studentId, payload: { date: validated.date, batchId: validated.batchId } })
          }

          if (record.status === "ABSENT" || record.status === "LATE") {
            const studentInfo = studentMap.get(record.studentId)
            const parentEmail = studentInfo?.parent?.email || studentInfo?.email
            const parentUserId = studentInfo?.parent?.userId || studentInfo?.userId || null

            if (parentEmail) {
              if (record.status === "ABSENT") {
                notificationsToCreate.push({
                  schoolId,
                  studentId: record.studentId,
                  type: "ABSENT_ALERT",
                  sentTo: parentEmail,
                  status: "SENT"
                })
              }
              lowAttendanceCheckIds.push(record.studentId)
            }

            if (parentUserId && studentInfo) {
              postTxEvents.push({
                eventType: "ATTENDANCE_MARKED",
                studentId: record.studentId,
                payload: {
                  userId: parentUserId,
                  schoolId,
                  studentName: studentInfo.name,
                  date: validated.date,
                  status: record.status
                }
              })
            }
          }
        }
      }

      // 3. Execute Transactional Batch Writes ($O(1)$ query count inside lock)
      await db.$transaction(async (tx) => {
        if (newRecordsToCreate.length > 0) {
          await tx.attendance.createMany({
            data: newRecordsToCreate,
            skipDuplicates: true
          })
        }

        // Parallel updates for existing records whose status changed
        if (recordsToUpdate.length > 0) {
          await Promise.all(
            recordsToUpdate.map(up =>
              tx.attendance.update({
                where: { id: up.id },
                data: { status: up.status, remarks: up.remarks, recordedBy: userId }
              })
            )
          )
        }

        if (auditLogsToCreate.length > 0) {
          await tx.auditLog.createMany({
            data: auditLogsToCreate
          })
        }

        if (notificationsToCreate.length > 0) {
          await tx.notification.createMany({
            data: notificationsToCreate
          })
        }

        // Update Register Snapshot
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
        })
      })

      // 4. Post-Transaction Decoupled Operations (P1-02: Redis outside transactions)
      // Execute events and cache warnings without holding database transaction locks
      Promise.allSettled([
        ...postTxEvents.map(ev =>
          publishEvent({
            tx: db as any,
            eventType: ev.eventType,
            entityType: ev.eventType === "ATTENDANCE_CORRECTED" ? "ATTENDANCE" : "ATTENDANCE",
            entityId: ev.payload.attendanceId || ev.studentId,
            schoolId,
            payload: ev.payload
          })
        ),
        (async () => {
          if (lowAttendanceCheckIds.length === 0) return;
          for (const sId of lowAttendanceCheckIds) {
            try {
              const allRecords = await db.attendance.findMany({
                where: { studentId: sId, schoolId, status: { notIn: ["NOT_MARKED", "HOLIDAY"] } }
              });
              let presLate = 0;
              for (const r of allRecords) {
                if (r.status === "PRESENT" || r.status === "LATE") presLate++;
              }
              if (allRecords.length > 0 && (presLate / allRecords.length) * 100 < 75) {
                const warnKey = `warn:${sId}`;
                const hasWarned = await redis?.get(warnKey);
                if (!hasWarned) {
                  const sInfo = studentMap.get(sId);
                  const pEmail = sInfo?.parent?.email || sInfo?.email;
                  if (pEmail) {
                    await db.notification.create({
                      data: { schoolId, studentId: sId, type: "LOW_ATTENDANCE_WARNING", sentTo: pEmail, status: "SENT" }
                    });
                    await redis?.set(warnKey, 1, { ex: 604800 });
                  }
                }
              }
            } catch (err) {
              log.error({ err, sId }, "[Non-blocking Error] Failed to process low attendance warning");
            }
          }
        })()
      ]).catch(err => log.error({ err }, "Error in post-transaction background attendance processing"))

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
