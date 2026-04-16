"use server"

import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { markAttendance, markAttendanceSchema } from "@/lib/dal/attendance"

export async function markAttendanceAction(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session) return { error: "Unauthorized" }

  const raw = Object.fromEntries(formData.entries())
  const result = markAttendanceSchema.safeParse(raw)

  if (!result.success) {
    return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
  }

  try {
    await markAttendance(result.data)
    revalidatePath("/attendance")
    return { success: true }
  } catch (e) {
    return { error: "Failed to mark attendance" }
  }
}
