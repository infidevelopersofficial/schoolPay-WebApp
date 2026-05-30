"use server"

import { withTenantAuth } from "@/lib/tenant-auth"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { updateSchool } from "@/lib/dal/schools"
import { getSchoolId } from "@/lib/tenant-context"
import { z } from "zod"

const updateSchoolSettingsSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  logo: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  gstin: z.string().optional(),
  state: z.string().optional(),
})

export async function updateSchoolSettingsAction(prevState: any, formData: FormData) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      const session = await auth()
  if (!session) return { error: "Unauthorized" }

  const raw = Object.fromEntries(formData.entries())
  const result = updateSchoolSettingsSchema.safeParse(raw)

  if (!result.success) {
    return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
  }

  try {
    const schoolId = await getSchoolId()
    // Filter out empty strings so we don't overwrite with blanks
    const cleanData = Object.fromEntries(
      Object.entries(result.data).filter(([_, v]) => v !== undefined && v !== "")
    )
    await updateSchool(schoolId, cleanData)
    revalidatePath("/dashboard/settings")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (e) {
    return { error: "Failed to update school settings" }
  }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}