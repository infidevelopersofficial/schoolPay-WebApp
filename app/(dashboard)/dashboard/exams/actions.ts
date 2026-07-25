"use server"

import { revalidatePath } from "next/cache"
import { createExamGroup, createExam, createExamSchema, toggleExamLock, toggleExamPublish } from "@/lib/dal/exams"
import { withTenantAuth } from "@/lib/tenant-auth"

export async function createExamGroupAction(formData: FormData) {
  try {
    return await withTenantAuth(null, ["ADMIN", "TEACHER"], async () => {
      const name = formData.get("name") as string
      const sessionId = formData.get("sessionId") as string
      const gradingSchemeId = formData.get("gradingSchemeId") as string | null

      await createExamGroup({ name, sessionId, gradingSchemeId: gradingSchemeId || undefined })
      
      revalidatePath("/dashboard/exams")
      return { success: true }
    })
  } catch (error: any) {
    return { success: false, error: error.message || "Unauthorized" }
  }
}

export async function createExamAction(state: any, formData: FormData) {
  try {
    return await withTenantAuth(null, ["ADMIN", "TEACHER"], async () => {
      const raw = Object.fromEntries(formData.entries())
      const date = raw.date as string
      const startTimeStr = raw.startTime as string
      const endTimeStr = raw.endTime as string
      
      const payload = {
        ...raw,
        startTime: startTimeStr ? new Date(`${date}T${startTimeStr}`) : undefined,
        endTime: endTimeStr ? new Date(`${date}T${endTimeStr}`) : undefined,
        teacherId: raw.teacherId ? (raw.teacherId as string) : undefined,
      }

      const result = createExamSchema.safeParse(payload)
      if (!result.success) {
         return { success: false, error: "Validation failed" }
      }

      await createExam(result.data)
      
      revalidatePath("/dashboard/exams")
      return { success: true }
    })
  } catch (error: any) {
    return { success: false, error: error.message || "Unauthorized" }
  }
}

export async function toggleMarksLockAction(examId: string, locked: boolean) {
  try {
    return await withTenantAuth(null, ["ADMIN", "TEACHER"], async () => {
      await toggleExamLock(examId, locked)
      revalidatePath("/dashboard/exams")
      return { success: true }
    })
  } catch (error: any) {
    return { success: false, error: error.message || "Unauthorized" }
  }
}

export async function togglePublishResultsAction(examId: string, published: boolean) {
  try {
    return await withTenantAuth(null, ["ADMIN", "TEACHER"], async () => {
      await toggleExamPublish(examId, published)
      revalidatePath("/dashboard/exams")
      return { success: true }
    })
  } catch (error: any) {
    return { success: false, error: error.message || "Unauthorized" }
  }
}