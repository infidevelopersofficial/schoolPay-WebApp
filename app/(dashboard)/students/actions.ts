"use server"

import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { createStudent, createStudentSchema } from "@/lib/dal/students"

export async function addStudentAction(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session) return { error: "Unauthorized" }

  const raw = Object.fromEntries(formData.entries())
  const result = createStudentSchema.safeParse(raw)

  if (!result.success) {
    return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
  }

  try {
    await createStudent(result.data)
    revalidatePath("/students")
    return { success: true }
  } catch (e: any) {
    if (e?.code === "P2002") return { error: "A student with this email already exists" }
    return { error: "Failed to create student" }
  }
}
