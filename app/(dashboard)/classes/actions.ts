"use server"

import { revalidatePath } from "next/cache"
import { createClass, createClassSchema, getClasses } from "@/lib/dal/classes"
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
      revalidatePath("/classes")
      return { success: true }
    })
  } catch (e: any) {
    if (e?.prismaCode === "P2002") return { error: "This class section already exists" }
    return { error: e.message || "Failed to create class" }
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
