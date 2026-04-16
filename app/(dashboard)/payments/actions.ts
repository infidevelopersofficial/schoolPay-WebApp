"use server"

import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { createPayment, createPaymentSchema } from "@/lib/dal/payments"

export async function recordPaymentAction(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session) return { error: "Unauthorized" }

  const raw = Object.fromEntries(formData.entries())
  const result = createPaymentSchema.safeParse(raw)

  if (!result.success) {
    return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
  }

  try {
    await createPayment(result.data)
    revalidatePath("/payments")
    revalidatePath("/students")
    return { success: true }
  } catch (e) {
    return { error: "Failed to record payment" }
  }
}
