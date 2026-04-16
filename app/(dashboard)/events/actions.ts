"use server"

import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { createEvent, createEventSchema } from "@/lib/dal/events"

export async function createEventAction(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session) return { error: "Unauthorized" }

  const raw = Object.fromEntries(formData.entries())
  const result = createEventSchema.safeParse(raw)

  if (!result.success) {
    return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
  }

  try {
    await createEvent(result.data)
    revalidatePath("/events")
    return { success: true }
  } catch (e) {
    return { error: "Failed to create event" }
  }
}
