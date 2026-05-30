"use server"

import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { createExamGroup, createExam, toggleExamLock, toggleExamPublish } from "@/lib/dal/exams"

export async function createExamGroupAction(formData: FormData) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const name = formData.get("name") as string
    const sessionId = formData.get("sessionId") as string
    const gradingSchemeId = formData.get("gradingSchemeId") as string | null

    await createExamGroup({ name, sessionId, gradingSchemeId: gradingSchemeId || undefined })
    
    revalidatePath("/dashboard/exams")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createExamAction(state: any, formData: FormData) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const name = formData.get("name") as string
    const examGroupId = formData.get("examGroupId") as string
    const batchId = formData.get("batchId") as string
    const subjectId = formData.get("subjectId") as string
    const sessionId = formData.get("sessionId") as string
    const date = formData.get("date") as string
    const startTimeStr = formData.get("startTime") as string
    const endTimeStr = formData.get("endTime") as string
    const maxMarks = formData.get("maxMarks") as string
    
    const startTime = startTimeStr ? new Date(`${date}T${startTimeStr}`) : undefined
    const endTime = endTimeStr ? new Date(`${date}T${endTimeStr}`) : undefined

    await createExam({
      name,
      examGroupId,
      batchId,
      subjectId,
      sessionId,
      date,
      startTime,
      endTime,
      maxMarks: parseFloat(maxMarks),
    })
    
    revalidatePath("/dashboard/exams")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function toggleMarksLockAction(examId: string, locked: boolean) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" }
  }

  try {
    await toggleExamLock(examId, locked)
    revalidatePath("/dashboard/exams")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function togglePublishResultsAction(examId: string, published: boolean) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" }
  }

  try {
    await toggleExamPublish(examId, published)
    revalidatePath("/dashboard/exams")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}