"use server"

import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { sendMessage, sendMessageSchema } from "@/lib/dal/messages"

export async function sendMessageAction(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session) return { error: "Unauthorized" }

  const raw = Object.fromEntries(formData.entries())
  const result = sendMessageSchema.safeParse({
    ...raw,
    from: session.user?.name || "Unknown User",
    fromEmail: session.user?.email || "unknown@school.com",
    // We expect the form to provide to, toEmail, subject, and body
  })

  if (!result.success) {
    return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
  }

  try {
    await sendMessage(result.data)
    revalidatePath("/messages")
    return { success: true }
  } catch (e) {
    return { error: "Failed to send message" }
  }
}
