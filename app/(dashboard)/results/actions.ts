"use server"

import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { uploadResult, uploadResultSchema } from "@/lib/dal/results"

export async function uploadResultAction(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session) return { error: "Unauthorized" }

  const raw = Object.fromEntries(formData.entries())
  const result = uploadResultSchema.safeParse(raw)

  if (!result.success) {
    return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
  }

  try {
    await uploadResult(result.data)
    revalidatePath("/results")
    return { success: true }
  } catch (e) {
    return { error: "Failed to upload result" }
  }
}
