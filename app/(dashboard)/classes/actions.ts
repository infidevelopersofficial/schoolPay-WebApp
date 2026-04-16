"use server"

import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { createClass, createClassSchema } from "@/lib/dal/classes"

export async function addClassAction(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session) return { error: "Unauthorized" }

  const raw = Object.fromEntries(formData.entries())
  const result = createClassSchema.safeParse(raw)

  if (!result.success) {
    return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
  }

  try {
    await createClass(result.data)
    revalidatePath("/classes")
    return { success: true }
  } catch (e: any) {
    if (e?.code === "P2002") return { error: "This class section already exists" }
    return { error: "Failed to create class" }
  }
}
