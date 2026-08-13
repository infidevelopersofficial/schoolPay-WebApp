import { prisma } from "@/lib/prisma"
import { getSchoolId } from "@/lib/tenant-context"
import { auth } from "@/lib/auth"
import { recordAuditLog } from "@/lib/audit"
import { PromotionStatus } from "@prisma/client"

export async function promoteStudents(input: {
  sourceClass: string
  sourceSection?: string
  sourceSessionId: string
  targetClass: string
  targetSection?: string
  targetSessionId: string
  studentIds: string[]
  detainedStudentIds: string[]
}): Promise<{
  promoted: number
  detained: number
  skipped: { studentId: string; reason: string }[]
}> {
  const schoolId = await getSchoolId()
  const session = await auth()
  const promotedByUserId = session?.user?.id

  if (!promotedByUserId) {
    throw new Error("Unauthorized: Cannot process promotion without user context.")
  }

  const {
    sourceClass,
    sourceSection,
    sourceSessionId,
    targetClass,
    targetSection,
    targetSessionId,
    studentIds,
    detainedStudentIds,
  } = input

  const allRequestedIds = [...new Set([...studentIds, ...detainedStudentIds])]

  if (allRequestedIds.length === 0) {
    return { promoted: 0, detained: 0, skipped: [] }
  }

  // 1. Fetch all requested students in one query
  const students = await prisma.student.findMany({
    where: {
      id: { in: allRequestedIds }
    }
  })

  const studentMap = new Map(students.map(s => [s.id, s]))

  const skipped: { studentId: string; reason: string }[] = []
  const validPromotedIds: string[] = []
  const validDetainedIds: string[] = []

  // Pre-validate all students
  for (const id of studentIds) {
    const student = studentMap.get(id)
    if (!student) {
      skipped.push({ studentId: id, reason: "Student not found" })
      continue
    }
    if (student.schoolId !== schoolId) {
      skipped.push({ studentId: id, reason: "Tenant mismatch" })
      continue
    }
    if (!student.sessionId) {
      skipped.push({ studentId: id, reason: "Student has no current session ID" })
      continue
    }
    validPromotedIds.push(id)
  }

  for (const id of detainedStudentIds) {
    const student = studentMap.get(id)
    if (!student) {
      skipped.push({ studentId: id, reason: "Student not found" })
      continue
    }
    if (student.schoolId !== schoolId) {
      skipped.push({ studentId: id, reason: "Tenant mismatch" })
      continue
    }
    if (!student.sessionId) {
      skipped.push({ studentId: id, reason: "Student has no current session ID" })
      continue
    }
    validDetainedIds.push(id)
  }

  if (validPromotedIds.length === 0 && validDetainedIds.length === 0) {
    return { promoted: 0, detained: 0, skipped }
  }

  // 2. Execute promotion via interactive transaction
  await prisma.$transaction(async (tx) => {
    // Process Promotions
    for (const id of validPromotedIds) {
      const student = studentMap.get(id)!
      
      await tx.studentAcademicHistory.create({
        data: {
          studentId: id,
          schoolId,
          class: student.class,
          section: student.section,
          sessionId: student.sessionId!,
          promotedToClass: targetClass,
          status: PromotionStatus.PROMOTED,
          promotedByUserId
        }
      })

      await tx.student.update({
        where: { id },
        data: {
          class: targetClass,
          section: targetSection ?? student.section,
          sessionId: targetSessionId
        }
      })
    }

    // Process Detentions
    for (const id of validDetainedIds) {
      const student = studentMap.get(id)!
      
      await tx.studentAcademicHistory.create({
        data: {
          studentId: id,
          schoolId,
          class: student.class,
          section: student.section,
          sessionId: student.sessionId!,
          promotedToClass: null,
          status: PromotionStatus.DETAINED,
          promotedByUserId
        }
      })

      await tx.student.update({
        where: { id },
        data: {
          sessionId: targetSessionId
        }
      })
    }

    // 3. Record Audit Log for the entire batch
    await recordAuditLog({
      action: "CREATE",
      entityType: "PROMOTION_BATCH",
      entityId: targetSessionId,
      schoolId,
      userId: promotedByUserId,
      newValues: {
        promoted: validPromotedIds.length,
        detained: validDetainedIds.length,
        sourceClass,
        targetClass,
        targetSessionId
      },
      description: `Promoted ${validPromotedIds.length} students from Class ${sourceClass} to Class ${targetClass} for session ${targetSessionId}`
    }, tx)
  }, {
    // Allow up to 10 seconds for large batches
    timeout: 10000 
  })

  return {
    promoted: validPromotedIds.length,
    detained: validDetainedIds.length,
    skipped
  }
}
