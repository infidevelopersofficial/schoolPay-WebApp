"use server"

import { withTenantAuth } from "@/lib/tenant-auth"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { createSubject, createSubjectSchema } from "@/lib/dal/subjects"

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