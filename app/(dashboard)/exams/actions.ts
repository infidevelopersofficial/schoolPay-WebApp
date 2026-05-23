"use server"

import { withTenantAuth } from "@/lib/tenant-auth"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { createExam, createExamSchema } from "@/lib/dal/exams"

export async function createExamAction(prevState: any, formData: FormData) {
  try {
    return await withTenantAuth("hasExams", ["ADMIN", "TEACHER"], async () => {
      const session = await auth()
  if (!session) return { error: "Unauthorized" }

  const raw = Object.fromEntries(formData.entries())
  const result = createExamSchema.safeParse(raw)

  if (!result.success) {
    return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
  }

  try {
    await createExam(result.data)
    revalidatePath("/exams")
    return { success: true }
  } catch (e) {
    return { error: "Failed to schedule exam" }
  }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}