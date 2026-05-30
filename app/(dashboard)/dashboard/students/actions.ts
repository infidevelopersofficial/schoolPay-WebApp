"use server"

import { withTenantAuth } from "@/lib/tenant-auth"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { createStudent, createStudentSchema } from "@/lib/dal/students"

export async function addStudentAction(prevState: any, formData: FormData) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      const session = await auth()
      if (!session) return { error: "Unauthorized" }

      const raw = Object.fromEntries(formData.entries())
      const result = createStudentSchema.safeParse(raw)

      if (!result.success) {
        return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
      }

      try {
        await createStudent(result.data)
        revalidatePath("/dashboard/students")
        return { success: true }
      } catch (e: any) {
        if (e?.message === "A parent account with this email already exists.") {
          return { error: e.message }
        }
        if (e?.code === "P2002") return { error: "A student with this email already exists" }
        return { error: "Failed to create student" }
      }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}