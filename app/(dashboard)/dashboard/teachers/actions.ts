"use server"

import { revalidatePath } from "next/cache"
import { createTeacher, createTeacherSchema, deleteTeacher as deleteTeacherDal, updateTeacher } from "@/lib/dal/teachers"
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

export async function updateTeacherAction(prevState: any, formData: FormData) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      const raw = Object.fromEntries(formData.entries())
      const id = raw.id as string
      if (!id) return { error: "Teacher ID is missing" }
      
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

      const result = createTeacherSchema.partial().safeParse(payload)

      if (!result.success) {
        return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
      }

      try {
        await updateTeacher(id, result.data)
        revalidatePath("/dashboard/teachers")
        revalidatePath(`/dashboard/teachers/${id}`)
        return { success: true }
      } catch (e: any) {
        console.error("Error updating teacher:", e)
        return { error: `Failed to update teacher: ${e?.message || e}` }
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

export async function searchTeachersAction(query: string) {
  try {
    return await withTenantAuth(null, ["ADMIN", "TEACHER"], async () => {
      try {
        const { searchTeachers } = await import("@/lib/dal/teachers")
        const results = await searchTeachers(query, 20)
        return results.map(t => ({
          value: t.id,
          label: t.name,
          subLabel: t.email
        }))
      } catch (e: any) {
        console.error("Failed to search teachers:", e)
        return []
      }
    })
  } catch (e: any) {
    console.error(e)
    return []
  }
}

import { createClass } from "@/lib/dal/classes"
import { createSubject } from "@/lib/dal/subjects"

export async function createClassInlineForTeacherAction(name: string, section: string) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      if (!name.trim() || !section.trim()) {
        return { error: "Class name and section are required" }
      }
      try {
        const cls = await createClass({ name: name.trim(), section: section.trim(), capacity: 40 })
        revalidatePath("/dashboard/teachers")
        return { success: true, classItem: cls }
      } catch (e: any) {
        console.error("Error creating class inline:", e)
        return { error: e?.message || "Failed to create class" }
      }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}

export async function createSubjectInlineForTeacherAction(name: string, code: string) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      if (!name.trim() || !code.trim()) {
        return { error: "Subject name and code are required" }
      }
      try {
        const sub = await createSubject({ name: name.trim(), code: code.trim().toUpperCase() })
        revalidatePath("/dashboard/teachers")
        return { success: true, subjectItem: sub }
      } catch (e: any) {
        console.error("Error creating subject inline:", e)
        return { error: e?.message || "Failed to create subject" }
      }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}