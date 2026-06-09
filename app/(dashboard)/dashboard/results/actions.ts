"use server"

import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { bulkUpsertResults } from "@/lib/dal/results"

export async function bulkUpsertResultAction(formData: FormData) {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  // Allow Teachers and Admins
  if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const examId = formData.get("examId") as string
    const sessionId = formData.get("sessionId") as string
    const overrideReason = formData.get("overrideReason") as string | undefined
    
    // Parse results from JSON string in form data
    const resultsStr = formData.get("results") as string
    if (!resultsStr) {
      throw new Error("Missing results data")
    }
    
    const results = JSON.parse(resultsStr)

    // Ensure only admins can supply an override reason
    if (overrideReason && session.user.role !== "ADMIN") {
      throw new Error("Only admins can perform locked exam overrides")
    }

    const { upsertedCount, modifiedCount } = await bulkUpsertResults({
      examId,
      sessionId,
      results,
      overrideReason: session.user.role === "ADMIN" ? overrideReason : undefined,
    }, session.user.id)
    
    revalidatePath("/dashboard/exams")
    return { success: true, upsertedCount, modifiedCount }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

import { prisma } from "@/lib/prisma"
import { getSchoolId } from "@/lib/tenant-context"
import { withTenantAuth } from "@/lib/tenant-auth"

export async function getStudentsForExamAction(examId: string) {
  try {
    return await withTenantAuth(null, ["ADMIN", "SUPER_ADMIN", "TEACHER"], async () => {
      const session = await auth()
      if (!session) return { error: "Unauthorized" }

      const schoolId = await getSchoolId()
      
      const exam = await prisma.exam.findUnique({
        where: { id: examId, schoolId },
        include: { batch: true }
      })

      if (!exam) return { error: "Exam not found" }

      // Students enrolled in this batch
      const enrollments = await prisma.enrollment.findMany({
        where: { batchId: exam.batchId, schoolId, status: "ACTIVE" },
        include: {
          student: true,
        }
      })

      // Existing results for this exam
      const results = await prisma.result.findMany({
        where: { examId, schoolId }
      })

      const data = enrollments.map(e => {
        const result = results.find(r => r.studentId === e.studentId)
        return {
          student: e.student,
          result: result || null
        }
      })

      return { success: true, data }
    })
  } catch (e: any) {
    return { error: e.message || "Failed to fetch students" }
  }
}

export async function saveStudentResultAction({ examId, studentId, marks, sessionId }: { examId: string, studentId: string, marks: number | null, sessionId: string }) {
  try {
    return await withTenantAuth(null, ["ADMIN", "SUPER_ADMIN", "TEACHER"], async () => {
      const session = await auth()
      if (!session || !session.user?.id) return { error: "Unauthorized" }

      const schoolId = await getSchoolId()

      const result = await prisma.result.upsert({
        where: {
          examId_studentId: {
            examId,
            studentId
          }
        },
        update: {
          marks,
          enteredById: session.user.id
        },
        create: {
          examId,
          studentId,
          schoolId,
          sessionId,
          marks,
          enteredById: session.user.id
        }
      })

      revalidatePath("/dashboard/results")
      return { success: true, data: result }
    })
  } catch (e: any) {
    return { error: e.message || "Failed to save result" }
  }
}

export async function computeGradesAction(examGroupId: string) {
  try {
    return await withTenantAuth(null, ["ADMIN", "SUPER_ADMIN", "TEACHER"], async () => {
      const session = await auth()
      if (!session) return { error: "Unauthorized" }

      const schoolId = await getSchoolId()

      const examGroup = await prisma.examGroup.findUnique({
        where: { id: examGroupId, schoolId },
        include: { gradingScheme: { include: { bands: true } } }
      })

      if (!examGroup || !examGroup.gradingScheme) {
        return { error: "No grading scheme configured" }
      }

      const bands = examGroup.gradingScheme.bands.sort((a, b) => b.minMarks - a.minMarks)

      // Get all results for exams in this group
      const exams = await prisma.exam.findMany({
        where: { examGroupId, schoolId },
        select: { id: true, maxMarks: true }
      })

      const examMap = new Map(exams.map(e => [e.id, e.maxMarks]))

      const results = await prisma.result.findMany({
        where: { examId: { in: exams.map(e => e.id) }, schoolId, marks: { not: null } }
      })

      let updatedCount = 0

      // Compute grade for each result
      for (const result of results) {
        if (result.marks === null) continue

        const maxMarks = examMap.get(result.examId) || 100
        const percentage = (result.marks / maxMarks) * 100

        // Find the applicable grade band
        const band = bands.find(b => percentage >= b.minMarks && percentage <= b.maxMarks)
        const grade = band ? band.name : null

        if (grade !== result.grade) {
          await prisma.result.update({
            where: { id: result.id },
            data: { grade }
          })
          updatedCount++
        }
      }

      revalidatePath("/dashboard/results")
      return { success: true, updatedCount }
    })
  } catch (e: any) {
    return { error: e.message || "Failed to compute grades" }
  }
}

export async function getReportCardsDataAction(examGroupId: string, batchId: string) {
  try {
    return await withTenantAuth(null, ["ADMIN", "SUPER_ADMIN", "TEACHER"], async () => {
      const session = await auth()
      if (!session) return { error: "Unauthorized" }

      const schoolId = await getSchoolId()

      const school = await prisma.school.findUnique({ where: { id: schoolId }})
      const examGroup = await prisma.examGroup.findUnique({ where: { id: examGroupId, schoolId }})
      const batch = await prisma.batch.findUnique({ where: { id: batchId, schoolId }})

      if (!school || !examGroup || !batch) return { error: "Data not found" }

      const exams = await prisma.exam.findMany({
        where: { examGroupId, batchId, schoolId },
        include: { subject: true }
      })

      const enrollments = await prisma.enrollment.findMany({
        where: { batchId, schoolId, status: "ACTIVE" },
        include: { student: true }
      })

      const results = await prisma.result.findMany({
        where: { 
          examId: { in: exams.map(e => e.id) },
          studentId: { in: enrollments.map(e => e.studentId) },
          schoolId
        }
      })

      const reportCards = enrollments.map(e => {
        const studentResults = results.filter(r => r.studentId === e.studentId)
        
        return {
          schoolName: school.name,
          studentName: e.student.name,
          rollNumber: e.student.rollNumber || "",
          className: batch.name,
          examGroupName: examGroup.name,
          subjects: exams.map(exam => {
            const result = studentResults.find(r => r.examId === exam.id)
            return {
              name: exam.subject.name,
              maxMarks: exam.maxMarks,
              marksObtained: result?.marks ?? null,
              grade: result?.grade ?? null,
              remarks: result?.remarks ?? null
            }
          })
        }
      })

      return { success: true, data: reportCards }
    })
  } catch (e: any) {
    return { error: e.message || "Failed to get report card data" }
  }
}