import { withTenantRead } from "@/lib/dal/core"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { recordAuditLog } from "@/lib/audit"
import { withDAL } from "@/lib/dal/utils"
import { getSchoolId } from "@/lib/tenant-context"
import { logger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"
import { publishEvent } from "@/lib/events/emitter"


const log = logger.child({ domain: "results" })

export const bulkUpsertResultSchema = z.object({
  examId: z.string().min(1),
  sessionId: z.string().min(1),
  results: z.array(z.object({
    studentId: z.string().min(1),
    marks: z.number().nullable(),
    grade: z.string().nullable(),
    status: z.enum(["DRAFT", "PUBLISHED", "ABSENT", "EXEMPTED"]),
    remarks: z.string().optional(),
  })),
  overrideReason: z.string().optional(),
})

export async function getResults(opts: { studentId?: string; examId?: string; examGroupId?: string; sessionId?: string }) {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
    const { studentId, examId, examGroupId, sessionId } = opts
    return withDAL(
      "results.getAll",
      () =>
        prisma.result.findMany({
          where: {
            schoolId,
            ...(studentId && { studentId }),
            ...(examId && { examId }),
            ...(sessionId && { sessionId }),
            ...(examGroupId && { exam: { examGroupId } }),
          },
          orderBy: { createdAt: "desc" },
          include: {
            student: { select: { name: true, admissionNumber: true, rollNumber: true } },
            exam: { select: { name: true, maxMarks: true, subject: { select: { name: true, code: true } } } },
          },
        }),
      { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
    )
  })
}

export async function bulkUpsertResults(input: z.infer<typeof bulkUpsertResultSchema>, userId: string) {
  const schoolId = await getSchoolId()
  const validated = bulkUpsertResultSchema.parse(input)
  
  return withDAL(
    "results.bulkUpsert",
    async () => {
      return await prisma.$transaction(async (tx) => {
        // 1. Fetch the exam to check lock status
        const exam = await tx.exam.findUnique({
          where: { id: validated.examId, examGroup: { schoolId } }
        })
        if (!exam) throw new Error("Exam not found")
        
        if (exam.marksLocked && !validated.overrideReason) {
          throw new Error("Marks are locked. Admin override reason is required.")
        }

        // 2. Fetch existing results to compare for modifications
        const existingResults = await tx.result.findMany({
          where: { examId: validated.examId, schoolId }
        })
        const existingMap = new Map(existingResults.map(r => [r.studentId, r]))

        let upsertedCount = 0
        let modifiedCount = 0

        const emitResultPublished = async (studentId: string, marks: number | null, grade: string | null) => {
          try {
            const student = await tx.student.findUnique({
              where: { id: studentId },
              include: { parent: true },
            });
            
            let parentUserId = student?.parent?.userId || student?.userId || null;
            if (!parentUserId && student?.parent?.email) {
              const matchingUser = await tx.user.findUnique({
                where: { email: student.parent.email },
              });
              parentUserId = matchingUser?.id || null;
            }

            if (parentUserId && student) {
              await publishEvent({
                tx,
                eventType: "RESULT_PUBLISHED",
                entityType: "RESULT",
                entityId: studentId,
                schoolId,
                payload: {
                  userId: parentUserId,
                  schoolId,
                  studentName: student.name,
                  examName: exam.name,
                  marks: marks || 0,
                  maxMarks: exam.maxMarks || 100,
                  grade: grade,
                },
              });
            }
          } catch (eventErr) {
            console.error("[Non-blocking Error] Failed to publish RESULT_PUBLISHED event:", eventErr);
          }
        };

        for (const res of validated.results) {
          const existing = existingMap.get(res.studentId)
          
          if (existing) {
            // Update
            const isChanged = existing.marks !== res.marks || existing.grade !== res.grade || existing.status !== res.status
            if (isChanged) {
              const updated = await tx.result.update({
                where: { id: existing.id },
                data: {
                  marks: res.marks,
                  grade: res.grade,
                  status: res.status,
                  remarks: res.remarks,
                  enteredById: userId,
                }
              })
              upsertedCount++

              // Emit RESULT_PUBLISHED event safely
              await emitResultPublished(res.studentId, res.marks, res.grade);

              // If exam was locked, log the modification
              if (exam.marksLocked) {
                await tx.gradeModificationLog.create({
                  data: {
                    resultId: updated.id,
                    oldMarks: existing.marks,
                    newMarks: res.marks,
                    oldGrade: existing.grade,
                    newGrade: res.grade,
                    reason: validated.overrideReason || "Admin Override",
                    changedById: userId
                  }
                })
                modifiedCount++
              }
            }
          } else {
            // Create
            await tx.result.create({
              data: {
                studentId: res.studentId,
                examId: validated.examId,
                schoolId,
                sessionId: validated.sessionId,
                marks: res.marks,
                grade: res.grade,
                status: res.status,
                remarks: res.remarks,
                enteredById: userId,
              }
            })
            upsertedCount++

            // Emit RESULT_PUBLISHED event safely
            await emitResultPublished(res.studentId, res.marks, res.grade);
          }
        }

        await recordAuditLog({
          action: "UPDATE",
          entityType: "RESULT",
          entityId: validated.examId,
          schoolId,
          newValues: { upsertedCount, modifiedCount },
          description: `Bulk upserted ${upsertedCount} results for exam ${exam.name}. ${modifiedCount} audit logs created.`,
        })

        return { upsertedCount, modifiedCount }
      })
    },
    { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
  )
}
