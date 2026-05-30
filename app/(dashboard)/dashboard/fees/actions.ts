"use server"

import { withTenantAuth } from "@/lib/tenant-auth"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { createFee, createFeeSchema, deleteFee } from "@/lib/dal/fees"

export async function addFeeAction(prevState: any, formData: FormData) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      const session = await auth()
  if (!session) return { error: "Unauthorized" }

  const raw = Object.fromEntries(formData.entries())
  const result = createFeeSchema.safeParse(raw)

  if (!result.success) {
    return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
  }

  try {
    await createFee(result.data)
    revalidatePath("/dashboard/fees")
    return { success: true }
  } catch (e) {
    return { error: "Failed to add fee type" }
  }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}

export async function deleteFeeAction(id: string) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      const session = await auth()
      if (!session) return { error: "Unauthorized" }
      try {
        await deleteFee(id)
        revalidatePath("/dashboard/fees")
        return { success: true }
      } catch (e) {
        return { error: "Failed to delete fee type" }
      }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}