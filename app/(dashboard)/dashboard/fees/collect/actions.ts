"use server"

import { withTenantAuth } from "@/lib/tenant-auth"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { createPayment, createPaymentSchema } from "@/lib/dal/payments"

export async function addPaymentAction(prevState: any, formData: FormData) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      const session = await auth()
      if (!session) return { error: "Unauthorized" }

      const raw = Object.fromEntries(formData.entries())
      const result = createPaymentSchema.safeParse(raw)

      if (!result.success) {
        return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
      }

      try {
        const payment = await createPayment(result.data)
        revalidatePath("/dashboard/students")
        revalidatePath("/dashboard/fees/collect")
        return { success: true, paymentId: payment.id, receiptNumber: payment.receiptNumber }
      } catch (e: any) {
        return { error: e.message || "Failed to process payment" }
      }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}
