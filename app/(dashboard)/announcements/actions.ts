"use server"

import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { createAnnouncement, createAnnouncementSchema } from "@/lib/dal/announcements"

export async function createAnnouncementAction(prevState: any, formData: FormData) {
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
    revalidatePath("/announcements")
    return { success: true }
  } catch (e) {
    return { error: "Failed to post announcement" }
  }
}
