"use server"

import { promoteStudents } from "@/lib/dal/promotions"
import { getStudents } from "@/lib/dal/students"
import { withTenantAuth } from "@/lib/tenant-auth"

export async function searchStudentsForPromotionAction(classFilter: string, sectionFilter: string | undefined, sessionFilter: string) {
  return withTenantAuth(null, ["ADMIN"], async () => {
    const result = await getStudents({ 
      classFilter, 
      sectionFilter, 
      sessionFilter, 
      limit: 1000 // load all for promotion preview
    })
    return result.students
  })
}

export async function promoteStudentsAction(prevState: any, formData: FormData) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      const sourceClass = formData.get("sourceClass") as string
      const sourceSection = formData.get("sourceSection") as string | undefined
      const sourceSessionId = formData.get("sourceSessionId") as string
      const targetClass = formData.get("targetClass") as string
      const targetSection = formData.get("targetSection") as string | undefined
      const targetSessionId = formData.get("targetSessionId") as string
      
      const studentIdsStr = formData.get("studentIds") as string
      const detainedStudentIdsStr = formData.get("detainedStudentIds") as string

      if (!sourceClass || !sourceSessionId || !targetClass || !targetSessionId || !studentIdsStr || !detainedStudentIdsStr) {
        return { error: "Missing required fields" }
      }

      let studentIds: string[] = []
      let detainedStudentIds: string[] = []

      try {
        studentIds = JSON.parse(studentIdsStr)
        detainedStudentIds = JSON.parse(detainedStudentIdsStr)
      } catch (e) {
        return { error: "Invalid JSON arrays for students" }
      }

      try {
        const result = await promoteStudents({
          sourceClass,
          sourceSection,
          sourceSessionId,
          targetClass,
          targetSection,
          targetSessionId,
          studentIds,
          detainedStudentIds
        })

        return { success: true, ...result }
      } catch (e: any) {
        return { error: e.message || "Failed to promote students" }
      }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}
