"use server"

import { withTenantAuth } from "@/lib/tenant-auth"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { createLesson, createLessonSchema } from "@/lib/dal/lessons"

export async function createLessonAction(prevState: any, formData: FormData) {
  try {
    return await withTenantAuth(null, ["ADMIN", "TEACHER"], async () => {
      const session = await auth()
  if (!session) return { error: "Unauthorized" }

  const raw = Object.fromEntries(formData.entries())
  const result = createLessonSchema.safeParse(raw)

  if (!result.success) {
    return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
  }

  try {
    await createLesson(result.data)
    revalidatePath("/dashboard/lessons")
    return { success: true }
  } catch (e) {
    return { error: "Failed to schedule lesson" }
  }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}