"use server"

import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { createClass, createClassSchema, getClasses } from "@/lib/dal/classes"

export async function addClassAction(_prevState: unknown, formData: FormData) {
  try {
    const session = await auth()
    if (!session) return { error: "Unauthorized" }

    const raw = Object.fromEntries(formData.entries())
    const result = createClassSchema.safeParse(raw)

    if (!result.success) {
      return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
    }

    await createClass(result.data)
    revalidatePath("/classes")
    return { success: true }
  } catch (e: any) {
    if (e?.prismaCode === "P2002") return { error: "This class section already exists" }
    return { error: "Failed to create class" }
  }
}

export async function getClassesAction() {
  return getClasses()
}
