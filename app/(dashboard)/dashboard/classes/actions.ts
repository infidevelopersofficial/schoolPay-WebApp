"use server"

import { revalidatePath } from "next/cache"
import { createClass, createClassSchema, getClasses, deleteClass, updateClass } from "@/lib/dal/classes"
import { withTenantAuth } from "@/lib/tenant-auth"

export async function addClassAction(_prevState: unknown, formData: FormData) {
  try {
    return await withTenantAuth("hasClasses", ["ADMIN"], async () => {
      const raw = Object.fromEntries(formData.entries())
      const result = createClassSchema.safeParse(raw)

      if (!result.success) {
        return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
      }

      await createClass(result.data)
      revalidatePath("/dashboard/classes")
      return { success: true }
    })
  } catch (e: any) {
    if (e?.prismaCode === "P2002") return { error: "This class section already exists" }
    return { error: e.message || "Failed to create class" }
  }
}

export async function updateClassAction(_prevState: unknown, formData: FormData) {
  try {
    return await withTenantAuth("hasClasses", ["ADMIN"], async () => {
      const raw = Object.fromEntries(formData.entries())
      const id = raw.id as string
      if (!id) return { error: "Class ID is missing" }

      const result = createClassSchema.partial().safeParse(raw)

      if (!result.success) {
        return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
      }

      await updateClass(id, result.data)
      revalidatePath("/dashboard/classes")
      revalidatePath(`/dashboard/classes/${id}`)
      return { success: true }
    })
  } catch (e: any) {
    if (e?.prismaCode === "P2002") return { error: "This class section already exists" }
    return { error: e.message || "Failed to update class" }
  }
}

export async function getClassesAction() {
  try {
    return await withTenantAuth("hasClasses", ["ADMIN", "TEACHER"], async () => {
      return getClasses()
    })
  } catch (e: any) {
    throw new Error(e.message || "Unauthorized")
  }
}

export async function deleteClassAction(id: string) {
  try {
    return await withTenantAuth("hasClasses", ["ADMIN"], async () => {
      await deleteClass(id)
      revalidatePath("/dashboard/classes")
      return { success: true }
    })
  } catch (e: any) {
    return { error: e.message || "Failed to delete class" }
  }
}
