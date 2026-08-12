"use server"

import { withTenantAuth } from "@/lib/tenant-auth"
import { revalidatePath } from "next/cache"
import { 
  createTimetable, 
  createTimetableSchema, 
  upsertTimetablePeriod, 
  upsertTimetablePeriodSchema, 
  clearTimetablePeriod, 
  deleteTimetable 
} from "@/lib/dal/timetable"
import { DayOfWeek } from "@prisma/client"

export async function createTimetableAction(prevState: any, formData: FormData) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      const raw = Object.fromEntries(formData.entries())
      const result = createTimetableSchema.safeParse(raw)

      if (!result.success) {
        return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
      }

      try {
        const timetable = await createTimetable(result.data)
        revalidatePath("/dashboard/timetable")
        return { success: true, timetableId: timetable.id }
      } catch (e: any) {
        return { error: e.message || "Failed to create timetable" }
      }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}

export async function upsertTimetablePeriodAction(prevState: any, formData: FormData) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      const periodDataStr = formData.get("periodData") as string
      if (!periodDataStr) return { error: "Missing period data" }

      let raw
      try {
        raw = JSON.parse(periodDataStr)
      } catch (e) {
        return { error: "Invalid JSON for period data" }
      }

      const result = upsertTimetablePeriodSchema.safeParse(raw)

      if (!result.success) {
        return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
      }

      try {
        await upsertTimetablePeriod(result.data)
        revalidatePath("/dashboard/timetable")
        return { success: true }
      } catch (e: any) {
        // This surfaces the conflict error message explicitly from the DAL
        return { error: e.message || "Failed to update timetable period" }
      }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}

export async function clearTimetablePeriodAction(timetableId: string, dayOfWeek: DayOfWeek, periodNumber: number) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      if (!timetableId || !dayOfWeek || !periodNumber) {
        return { error: "Missing required parameters" }
      }

      try {
        await clearTimetablePeriod(timetableId, dayOfWeek, periodNumber)
        revalidatePath("/dashboard/timetable")
        return { success: true }
      } catch (e: any) {
        return { error: e.message || "Failed to clear period" }
      }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}

export async function deleteTimetableAction(id: string) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      if (!id) return { error: "Timetable ID is missing" }

      try {
        await deleteTimetable(id)
        revalidatePath("/dashboard/timetable")
        return { success: true }
      } catch (e: any) {
        return { error: e.message || "Failed to delete timetable" }
      }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}
