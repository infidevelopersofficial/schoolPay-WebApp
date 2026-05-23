"use server"

import { revalidatePath } from "next/cache"
import { createBatch, updateBatch, deactivateBatch, createBatchSchema } from "@/lib/dal/batches"
import { withTenantAuth } from "@/lib/tenant-auth"

export async function createBatchAction(prevState: any, formData: FormData) {
  try {
    return await withTenantAuth("hasBatches", ["ADMIN"], async () => {
      const raw = Object.fromEntries(formData.entries())
      
      if (!raw.code) delete raw.code;
      if (!raw.grade) delete raw.grade;
      if (!raw.section) delete raw.section;
      if (!raw.subjectFocus) delete raw.subjectFocus;
      if (!raw.startDate) delete raw.startDate;
      if (!raw.endDate) delete raw.endDate;
      if (!raw.teacherId) delete raw.teacherId;
      
      const result = createBatchSchema.safeParse(raw)

      if (!result.success) {
        return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
      }

      await createBatch(result.data)
      revalidatePath("/batches")
      return { success: true }
    })
  } catch (e: any) {
    return { error: e.message || "Failed to create batch" }
  }
}

export async function updateBatchAction(id: string, prevState: any, formData: FormData) {
  try {
    return await withTenantAuth("hasBatches", ["ADMIN"], async () => {
      const raw = Object.fromEntries(formData.entries())
      const result = createBatchSchema.partial().safeParse(raw)

      if (!result.success) {
        return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
      }

      await updateBatch(id, result.data)
      revalidatePath("/batches")
      return { success: true }
    })
  } catch (e: any) {
    return { error: e.message || "Failed to update batch" }
  }
}

export async function deactivateBatchAction(id: string) {
  try {
    return await withTenantAuth("hasBatches", ["ADMIN"], async () => {
      await deactivateBatch(id)
      revalidatePath("/batches")
      return { success: true }
    })
  } catch (e: any) {
    return { error: e.message || "Failed to deactivate batch" }
  }
}
