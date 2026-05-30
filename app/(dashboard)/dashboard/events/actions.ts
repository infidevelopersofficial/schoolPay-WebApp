"use server"

import { withTenantAuth } from "@/lib/tenant-auth"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { createEvent, createEventSchema } from "@/lib/dal/events"

export async function createEventAction(prevState: any, formData: FormData) {
  try {
    return await withTenantAuth(null, ["ADMIN", "TEACHER"], async () => {
      const session = await auth()
  if (!session) return { error: "Unauthorized" }

  const raw = Object.fromEntries(formData.entries())
  const result = createEventSchema.safeParse(raw)

  if (!result.success) {
    return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
  }

  try {
    await createEvent(result.data)
    revalidatePath("/dashboard/events")
    return { success: true }
  } catch (e) {
    return { error: "Failed to create event" }
  }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}