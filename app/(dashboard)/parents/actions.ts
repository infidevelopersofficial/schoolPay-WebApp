"use server"

import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { createParent, createParentSchema } from "@/lib/dal/parents"

export async function addParentAction(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session) return { error: "Unauthorized" }

  const raw = Object.fromEntries(formData.entries())
  const result = createParentSchema.safeParse(raw)

  if (!result.success) {
    return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
  }

  try {
    await createParent(result.data)
    revalidatePath("/parents")
    return { success: true }
  } catch (e: any) {
    if (e?.code === "P2002") return { error: "A parent with this email already exists" }
    return { error: "Failed to create parent" }
  }
}
