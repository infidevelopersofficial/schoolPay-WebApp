"use server"

import { revalidatePath } from "next/cache"
import { createTeacher, createTeacherSchema, deleteTeacher as deleteTeacherDal } from "@/lib/dal/teachers"
import { withTenantAuth } from "@/lib/tenant-auth"

export async function addTeacherAction(prevState: any, formData: FormData) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      const raw = Object.fromEntries(formData.entries())
      
      // Parse arrays that come from standard multiselect or custom JSON hidden fields
      const subjectIds = formData.getAll("subjectIds") as string[]
      
      let classAssignments = undefined
      const classAssignmentsData = formData.get("classAssignmentsData") as string
      if (classAssignmentsData) {
        try {
          classAssignments = JSON.parse(classAssignmentsData)
        } catch (e) {
          return { error: "Validation failed", fieldErrors: { classAssignments: ["Invalid JSON payload for class assignments"] } }
        }
      }

      const payload = {
        ...raw,
        subjectIds: subjectIds.length > 0 ? subjectIds : undefined,
        classAssignments,
      }

      const result = createTeacherSchema.safeParse(payload)

      if (!result.success) {
        return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
      }

      try {
        await createTeacher(result.data)
        revalidatePath("/dashboard/teachers")
        return { success: true }
      } catch (e: any) {
        console.error("Error creating teacher:", e)
        if (e?.code === "P2002") return { error: "A teacher with this email already exists" }
        return { error: `Failed to create teacher: ${e?.message || e}` }
      }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}

export async function deleteTeacherAction(id: string) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      try {
        await deleteTeacherDal(id)
        revalidatePath("/dashboard/teachers")
        return { success: true }
      } catch (e: any) {
        return { error: "Failed to delete teacher" }
      }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}