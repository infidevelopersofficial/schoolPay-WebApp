"use server"

import { withTenantAuth } from "@/lib/tenant-auth"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { createAnnouncement, createAnnouncementSchema, updateAnnouncement, deleteAnnouncement } from "@/lib/dal/announcements"

export async function createAnnouncementAction(prevState: any, formData: FormData) {
  try {
    return await withTenantAuth(null, ["ADMIN", "TEACHER"], async () => {
      const session = await auth()
  if (!session) return { error: "Unauthorized" }

  const raw = Object.fromEntries(formData.entries())
  const result = createAnnouncementSchema.safeParse({
    ...raw,
    date: new Date().toISOString().split("T")[0],
    author: session.user?.name || "Admin",
  })

  if (!result.success) {
    return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
  }

  try {
    await createAnnouncement(result.data)
    revalidatePath("/dashboard/announcements")
    return { success: true }
  } catch (e) {
    return { error: "Failed to post announcement" }
  }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}

export async function updateAnnouncementAction(prevState: any, formData: FormData) {
  try {
    return await withTenantAuth(null, ["ADMIN", "TEACHER"], async () => {
      const raw = Object.fromEntries(formData.entries())
      const id = raw.id as string
      if (!id) return { error: "Announcement ID is missing" }

      const result = createAnnouncementSchema.partial().safeParse(raw)

      if (!result.success) {
        return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
      }

      try {
        await updateAnnouncement(id, result.data)
        revalidatePath("/dashboard/announcements")
        revalidatePath(`/dashboard/announcements/${id}`)
        return { success: true }
      } catch (e: any) {
        return { error: e.message || "Failed to update announcement" }
      }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}