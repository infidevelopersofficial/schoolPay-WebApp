"use server"

import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { createFee, createFeeSchema } from "@/lib/dal/fees"

export async function addFeeAction(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session) return { error: "Unauthorized" }

  const raw = Object.fromEntries(formData.entries())
  const result = createFeeSchema.safeParse(raw)

  if (!result.success) {
    return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
  }

  try {
    await createFee(result.data)
    revalidatePath("/fees")
    return { success: true }
  } catch (e) {
    return { error: "Failed to add fee type" }
  }
}
