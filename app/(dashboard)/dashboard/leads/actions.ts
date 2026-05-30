"use server"

import { revalidatePath } from "next/cache"
import { createLead, updateLead, convertLeadToStudent, createLeadSchema } from "@/lib/dal/leads"
import { withTenantAuth } from "@/lib/tenant-auth"

export async function createLeadAction(prevState: any, formData: FormData) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      const raw = Object.fromEntries(formData.entries())
      
      // Clean up optional fields that might be empty strings
      if (!raw.courseInterest) delete raw.courseInterest;
      if (!raw.qualification) delete raw.qualification;
      if (!raw.targetExam) delete raw.targetExam;
      if (!raw.budget) delete raw.budget;
      if (!raw.assignedToId) delete raw.assignedToId;
      if (!raw.notes) delete raw.notes;
      if (!raw.nextFollowUpAt) delete raw.nextFollowUpAt;

      const result = createLeadSchema.safeParse(raw)

      if (!result.success) {
        return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
      }

      await createLead(result.data)
      revalidatePath("/dashboard/leads")
      return { success: true }
    })
  } catch (e: any) {
    return { error: e.message || "Failed to create lead" }
  }
}

export async function convertLeadAction(id: string) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      await convertLeadToStudent(id)
      revalidatePath("/dashboard/leads")
      revalidatePath("/dashboard/students")
      return { success: true }
    })
  } catch (e: any) {
    return { error: e.message || "Failed to convert lead" }
  }
}

export async function updateLeadStatusAction(id: string, status: string) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      await updateLead(id, { status })
      revalidatePath("/dashboard/leads")
      return { success: true }
    })
  } catch (e: any) {
    return { error: e.message || "Failed to update lead status" }
  }
}
