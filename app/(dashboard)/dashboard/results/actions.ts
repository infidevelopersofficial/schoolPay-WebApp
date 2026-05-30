"use server"

import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { bulkUpsertResults } from "@/lib/dal/results"

export async function bulkUpsertResultAction(formData: FormData) {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  // Allow Teachers and Admins
  if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const examId = formData.get("examId") as string
    const sessionId = formData.get("sessionId") as string
    const overrideReason = formData.get("overrideReason") as string | undefined
    
    // Parse results from JSON string in form data
    const resultsStr = formData.get("results") as string
    if (!resultsStr) {
      throw new Error("Missing results data")
    }
    
    const results = JSON.parse(resultsStr)

    // Ensure only admins can supply an override reason
    if (overrideReason && session.user.role !== "ADMIN") {
      throw new Error("Only admins can perform locked exam overrides")
    }

    const { upsertedCount, modifiedCount } = await bulkUpsertResults({
      examId,
      sessionId,
      results,
      overrideReason: session.user.role === "ADMIN" ? overrideReason : undefined,
    }, session.user.id)
    
    revalidatePath("/dashboard/exams")
    return { success: true, upsertedCount, modifiedCount }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}