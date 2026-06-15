"use server"

import { auth } from "@/lib/auth"
import { getTenantContext } from "@/lib/tenant-context"
import { revalidatePath } from "next/cache"
import { createTeacher, createTeacherSchema, deleteTeacher as deleteTeacherDal } from "@/lib/dal/teachers"
import { tenantContext } from "@/lib/prisma"

export async function addTeacherAction(prevState: any, formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user) return { error: "Unauthorized" }

    const { schoolId, schoolRole } = await getTenantContext()
    if (!schoolId) return { error: "No active school" }
    if (schoolRole !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return { error: "Unauthorized role" }
    }

    const raw = Object.fromEntries(formData.entries())
    const result = createTeacherSchema.safeParse(raw)

    if (!result.success) {
      return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
    }

    try {
      await tenantContext.run({ schoolId }, async () => {
        await createTeacher(result.data)
      })
      revalidatePath("/dashboard/teachers")
      return { success: true }
    } catch (e: any) {
      console.error("Error creating teacher:", e)
      if (e?.code === "P2002") return { error: "A teacher with this email already exists" }
      return { error: `Failed to create teacher: ${e?.message || e}` }
    }
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}

export async function deleteTeacherAction(id: string) {
  try {
    const session = await auth()
    if (!session?.user) return { error: "Unauthorized" }

    const { schoolId, schoolRole } = await getTenantContext()
    if (!schoolId) return { error: "No active school" }
    if (schoolRole !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return { error: "Unauthorized role" }
    }

    try {
      await tenantContext.run({ schoolId }, async () => {
        await deleteTeacherDal(id)
      })
      revalidatePath("/dashboard/teachers")
      return { success: true }
    } catch (e: any) {
      return { error: "Failed to delete teacher" }
    }
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}