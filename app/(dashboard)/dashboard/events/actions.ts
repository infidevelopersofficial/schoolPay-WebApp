"use server"

import { withTenantAuth } from "@/lib/tenant-auth"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { createEvent, createEventSchema, updateEvent } from "@/lib/dal/events"

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

export async function updateEventAction(prevState: any, formData: FormData) {
  try {
    return await withTenantAuth(null, ["ADMIN", "TEACHER"], async () => {
      const raw = Object.fromEntries(formData.entries())
      const id = raw.id as string
      if (!id) return { error: "Event ID is missing" }

      const result = createEventSchema.partial().safeParse(raw)

      if (!result.success) {
        return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
      }

      try {
        await updateEvent(id, result.data)
        revalidatePath("/dashboard/events")
        revalidatePath(`/dashboard/events/${id}`)
        return { success: true }
      } catch (e) {
        return { error: "Failed to update event" }
      }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}

export async function deleteEventAction(id: string) {
  try {
    return await withTenantAuth(null, ["ADMIN", "TEACHER"], async () => {
      if (!id) return { error: "Event ID is missing" }

      try {
        const { deleteEvent } = await import("@/lib/dal/events")
        await deleteEvent(id)
        revalidatePath("/dashboard/events")
        return { success: true }
      } catch (e: any) {
        return { error: e.message || "Failed to cancel event" }
      }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}