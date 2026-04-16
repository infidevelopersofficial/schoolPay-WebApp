"use server"

import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { createTeacher, createTeacherSchema } from "@/lib/dal/teachers"

export async function addTeacherAction(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session) return { error: "Unauthorized" }

  const raw = Object.fromEntries(formData.entries())
  const result = createTeacherSchema.safeParse(raw)

  if (!result.success) {
    return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
  }

  try {
    await createTeacher(result.data)
    revalidatePath("/teachers")
    return { success: true }
  } catch (e: any) {
    if (e?.code === "P2002") return { error: "A teacher with this email already exists" }
    return { error: "Failed to create teacher" }
  }
}
