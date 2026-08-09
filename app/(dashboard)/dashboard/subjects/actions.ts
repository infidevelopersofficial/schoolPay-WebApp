"use server"

import { withTenantAuth } from "@/lib/tenant-auth"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { createSubject, createSubjectSchema, updateSubject } from "@/lib/dal/subjects"

export async function addSubjectAction(prevState: any, formData: FormData) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      const session = await auth()
  if (!session) return { error: "Unauthorized" }

  const raw = Object.fromEntries(formData.entries())
  const result = createSubjectSchema.safeParse(raw)

  if (!result.success) {
    return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
  }

  try {
    await createSubject(result.data)
    revalidatePath("/dashboard/subjects")
    return { success: true }
  } catch (e: any) {
    if (e?.code === "P2002") return { error: "A subject with this code already exists" }
    return { error: "Failed to create subject" }
  }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}

export async function updateSubjectAction(prevState: any, formData: FormData) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      const raw = Object.fromEntries(formData.entries())
      const id = raw.id as string
      if (!id) return { error: "Subject ID is missing" }

      const result = createSubjectSchema.partial().safeParse(raw)

      if (!result.success) {
        return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
      }

      try {
        await updateSubject(id, result.data)
        revalidatePath("/dashboard/subjects")
        revalidatePath(`/dashboard/subjects/${id}`)
        return { success: true }
      } catch (e: any) {
        if (e?.code === "P2002") return { error: "A subject with this code already exists" }
        return { error: "Failed to update subject" }
      }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}

import { deleteSubject } from "@/lib/dal/subjects"

export const deleteSubjectAction = async (id: string) => {
  return await withTenantAuth(null, ["ADMIN"], async () => {
    if (!id) throw new Error("Subject ID is required")
    try {
      await deleteSubject(id)
      revalidatePath("/dashboard/subjects")
      return { success: true }
    } catch (err: any) {
      return { error: err.message || "Failed to delete subject" }
    }
  })
}