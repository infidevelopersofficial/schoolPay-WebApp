"use server"

import { withTenantAuth } from "@/lib/tenant-auth"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { createTeacher, createTeacherSchema, deleteTeacher as deleteTeacherDal } from "@/lib/dal/teachers"

export async function addTeacherAction(prevState: any, formData: FormData) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      const session = await auth()
      if (!session) return { error: "Unauthorized" }

      const raw = Object.fromEntries(formData.entries())
      const result = createTeacherSchema.safeParse(raw)

      if (!result.success) {
        return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
      }

      try {
        await createTeacher(result.data)
        revalidatePath("/dashboard/teachers")
        return { success: true }
      } catch (e: any) {
        console.error("Error creating teacher:", e)
        if (e?.code === "P2002") return { error: "A teacher with this email already exists" }
        return { error: `Failed to create teacher: ${e?.message || e}` }
      }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}

export async function deleteTeacherAction(id: string) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      const session = await auth()
      if (!session) return { error: "Unauthorized" }

      try {
        await deleteTeacherDal(id)
        revalidatePath("/dashboard/teachers")
        return { success: true }
      } catch (e: any) {
        return { error: "Failed to delete teacher" }
      }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}