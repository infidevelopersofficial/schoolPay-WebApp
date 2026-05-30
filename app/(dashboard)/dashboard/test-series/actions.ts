"use server"

import { revalidatePath } from "next/cache"
import { createTestSeries, createTestSeriesSchema } from "@/lib/dal/test-series"
import { withTenantAuth } from "@/lib/tenant-auth"

export async function createTestSeriesAction(prevState: any, formData: FormData) {
  try {
    return await withTenantAuth("hasExams", ["ADMIN", "TEACHER"], async () => {
      const raw = Object.fromEntries(formData.entries())
      
      if (!raw.scheduleEndDate) delete raw.scheduleEndDate;
      if (!raw.passingMarks) delete raw.passingMarks;

      const result = createTestSeriesSchema.safeParse(raw)

      if (!result.success) {
        return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
      }

      await createTestSeries(result.data)
      revalidatePath("/dashboard/test-series")
      return { success: true }
    })
  } catch (e: any) {
    return { error: e.message || "Failed to create test series" }
  }
}
