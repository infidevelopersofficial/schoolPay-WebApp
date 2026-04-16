"use server"

import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { createSubject, createSubjectSchema } from "@/lib/dal/subjects"

export async function addSubjectAction(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session) return { error: "Unauthorized" }

  const raw = Object.fromEntries(formData.entries())
  const result = createSubjectSchema.safeParse(raw)

  if (!result.success) {
    return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
  }

  try {
    await createSubject(result.data)
    revalidatePath("/subjects")
    return { success: true }
  } catch (e: any) {
    if (e?.code === "P2002") return { error: "A subject with this code already exists" }
    return { error: "Failed to create subject" }
  }
}
