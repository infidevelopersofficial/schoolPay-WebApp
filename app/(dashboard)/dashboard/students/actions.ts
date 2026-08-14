"use server"

import { withTenantAuth } from "@/lib/tenant-auth"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { createStudent, createStudentSchema, deleteStudent as deleteStudentDal, getStudents, getStudent, updateStudent } from "@/lib/dal/students"
import { getClasses, createClass } from "@/lib/dal/classes"

export async function addStudentAction(prevState: any, formData: FormData) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      const session = await auth()
      if (!session) return { error: "Unauthorized" }

      const raw = Object.fromEntries(formData.entries())
      const result = createStudentSchema.safeParse(raw)

      if (!result.success) {
        return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
      }

      try {
        await createStudent(result.data)
        revalidatePath("/dashboard/students")
        return { success: true }
      } catch (e: any) {
        console.error("Error creating student:", e)
        if (e?.message === "A parent account with this email already exists.") {
          return { error: e.message }
        }
        if (e?.prismaCode === "P2002") return { error: "A student with this email already exists" }
        return { error: `Failed to create student: ${e?.message || e}` }
      }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}

export async function updateStudentAction(prevState: any, formData: FormData) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      const session = await auth()
      if (!session) return { error: "Unauthorized" }

      const raw = Object.fromEntries(formData.entries())
      const id = raw.id as string
      if (!id) return { error: "Student ID is missing" }

      const result = createStudentSchema.partial().safeParse(raw)

      if (!result.success) {
        return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
      }

      const updatePayload = { ...result.data }
      delete updatePayload.parentName
      delete updatePayload.parentEmail
      delete updatePayload.parentMobile

      try {
        await updateStudent(id, updatePayload)
        revalidatePath("/dashboard/students")
        revalidatePath(`/dashboard/students/${id}`)
        revalidatePath(`/dashboard/students/${id}/edit`)
        return { success: true }
      } catch (e: any) {
        console.error("Error updating student:", e)
        return { error: `Failed to update student: ${e?.message || e}` }
      }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}

export async function getStudentForEditAction(id: string) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      const session = await auth()
      if (!session) return { error: "Unauthorized" }

      try {
        const student = await getStudent(id)
        if (!student) return { error: "Student not found" }

        // Map DB model to form-ready shape
        const classBase = student.class?.includes("-")
          ? student.class.split("-")[0]
          : student.class
        // Reconstruct the val format used by class select (e.g. "10-A")
        const classVal = student.section
          ? `${classBase}-${student.section}`
          : student.class

        return {
          student: {
            id: student.id,
            name: student.name,
            class: classVal || student.class,
            section: student.section || "",
            dateOfBirth: student.dateOfBirth
              ? new Date(student.dateOfBirth).toISOString().split("T")[0]
              : "",
            gender: student.gender || "",
            rollNumber: student.rollNumber || "",
            bloodGroup: student.bloodGroup || "",
            emergencyContact: student.emergencyContact || "",
            address: student.address || "",
            totalFees: Number(student.totalFees) || 0,
            parentId: student.parentId || "",
            parentName: student.parent?.name || "",
            parentEmail: student.parent?.email || "",
            parentMobile: student.parent?.mobile || "",
          }
        }
      } catch (e: any) {
        return { error: `Failed to load student: ${e?.message || e}` }
      }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}

export async function deleteStudentAction(id: string) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      const session = await auth()
      if (!session) return { error: "Unauthorized" }

      try {
        await deleteStudentDal(id)
        revalidatePath("/dashboard/students")
        return { success: true }
      } catch (e: any) {
        return { error: "Failed to delete student" }
      }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}

export async function searchStudentsAction(query: string) {
  try {
    return await withTenantAuth(null, ["ADMIN", "TEACHER"], async () => {
      const session = await auth()
      if (!session) throw new Error("Unauthorized")

      try {
        const { searchStudents } = await import("@/lib/dal/students")
        const results = await searchStudents(query, 20)
        return results.map(s => ({
          value: s.id,
          label: s.name,
          subLabel: s.admissionNumber ? `Adm: ${s.admissionNumber} | Class: ${s.class}` : `Class: ${s.class}`
        }))
      } catch (e: any) {
        console.error("Failed to search students:", e)
        return []
      }
    })
  } catch (e: any) {
    console.error(e)
    return []
  }
}

export async function getClassesForStudentAction() {
  try {
    return await withTenantAuth(null, ["ADMIN", "TEACHER"], async () => {
      const session = await auth()
      if (!session) return { error: "Unauthorized" }

      try {
        const classes = await getClasses()
        return {
          success: true,
          classes: classes.map(c => ({
            id: c.id,
            name: c.name,
            section: c.section,
            label: `Class ${c.name} - ${c.section}`,
            val: `${c.name}-${c.section}`,
          }))
        }
      } catch (e: any) {
        return { error: "Failed to load classes" }
      }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}

export async function createClassInlineAction(name: string, section: string) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      const session = await auth()
      if (!session) return { error: "Unauthorized" }

      try {
        const newClass = await createClass({
          name: name.trim(),
          section: section.trim().toUpperCase() || "A",
          capacity: 40,
        })
        revalidatePath("/dashboard/students/new")
        revalidatePath("/dashboard/classes")
        return {
          success: true,
          classItem: {
            id: newClass.id,
            name: newClass.name,
            section: newClass.section,
            label: `Class ${newClass.name} - ${newClass.section}`,
            val: `${newClass.name}-${newClass.section}`,
          }
        }
      } catch (e: any) {
        return { error: e.message || "Failed to create class inline" }
      }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}