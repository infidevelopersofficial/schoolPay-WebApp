"use server"

import { withTenantAuth } from "@/lib/tenant-auth"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { createFeeStructureWithMappings, CreateFeeStructureInput } from "@/lib/dal/fee-structure"
import { prisma } from "@/lib/prisma"
import { getSchoolId } from "@/lib/tenant-context"

export async function createFeeStructureWizardAction(input: CreateFeeStructureInput) {
  try {
    return await withTenantAuth(null, ["ADMIN", "SUPER_ADMIN"], async () => {
      const session = await auth()
      if (!session) return { error: "Unauthorized" }

      try {
        const structure = await createFeeStructureWithMappings(input)
        revalidatePath("/dashboard/fees")
        return { success: true, structureId: structure.id }
      } catch (e: any) {
        return { error: e.message || "Failed to create fee structure" }
      }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}

export async function generateInvoicesAction(structureId: string) {
  try {
    return await withTenantAuth(null, ["ADMIN", "SUPER_ADMIN"], async () => {
      const session = await auth()
      if (!session) return { error: "Unauthorized" }

      const schoolId = await getSchoolId()

      try {
        // Fetch the structure, items, and mapped classes
        const structure = await prisma.feeStructure.findUnique({
          where: { id: structureId, schoolId },
          include: {
            items: true,
            mappings: true,
          },
        })

        if (!structure) throw new Error("Fee structure not found")

        // Fetch students in mapped classes
        // The mappings link to `Class`, but `Student.class` in the schema is a String (class name)
        // Wait, the Enrollment model uses `batchId`, which maps to `Batch`.
        // Let me check how students are mapped to classes. 
        // In prisma/schema.prisma: 
        // Student has `class String` and `section String?` but also `enrollments Enrollment[]`.
        // It's safer to use the `Student.class` string if `Class.name` is what it maps to, or fetch the actual `Class` records to get their names.
        
        const mappedClassRecords = await prisma.class.findMany({
          where: { id: { in: structure.mappings.map(m => m.classId) } }
        })
        const mappedClassNames = mappedClassRecords.map(c => c.name)

        const students = await prisma.student.findMany({
          where: {
            class: { in: mappedClassNames },
            schoolId,
          },
        })

        // Generate mappings
        const newMappings = []

        for (const student of students) {
          for (const item of structure.items) {
            // Determine due dates based on frequency. For simplicity, just 1 due date for now, or 12 for monthly.
            // Ideally this would iterate over the session months. 
            // We'll generate a single immediate due date for ONE_TIME/ANNUAL, and 1 per month for MONTHLY.
            
            const dueDates: Date[] = []
            const now = new Date()
            
            if (item.frequency === "MONTHLY") {
              // Generate 12 months starting from current month
              for (let i = 0; i < 12; i++) {
                const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
                dueDates.push(d)
              }
            } else if (item.frequency === "QUARTERLY") {
              for (let i = 0; i < 4; i++) {
                const d = new Date(now.getFullYear(), now.getMonth() + i * 3, 1)
                dueDates.push(d)
              }
            } else {
              dueDates.push(now)
            }

            // TODO: Apply discounts
            // Fetch discounts for this student or class
            const discounts = await prisma.discountRule.findMany({
              where: {
                schoolId,
                OR: [
                  { scope: "STUDENT", studentId: student.id },
                  { scope: "CLASS", classId: { in: mappedClassRecords.map(c => c.id) } }
                ]
              }
            })

            for (const dueDate of dueDates) {
              let finalAmount = item.amount
              for (const discount of discounts) {
                if (discount.type === "PERCENTAGE") {
                  finalAmount = finalAmount - (finalAmount * (discount.value / 100))
                } else if (discount.type === "FIXED") {
                  finalAmount = finalAmount - discount.value
                }
              }

              newMappings.push({
                studentId: student.id,
                feeItemId: item.id,
                amount: Math.max(0, Math.floor(finalAmount)),
                dueDate: dueDate,
                schoolId,
              })
            }
          }
        }

        if (newMappings.length > 0) {
          await prisma.studentFeeMapping.createMany({
            data: newMappings,
            skipDuplicates: true, // Idempotency
          })
        }

        revalidatePath("/dashboard/fees")
        return { success: true, count: newMappings.length }
      } catch (e: any) {
        return { error: e.message || "Failed to generate invoices" }
      }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}

export async function getMappedClassesStrengthAction(classIds: string[]) {
  try {
    return await withTenantAuth(null, ["ADMIN", "SUPER_ADMIN"], async () => {
      const session = await auth()
      if (!session) return { error: "Unauthorized" }

      const schoolId = await getSchoolId()

      const classes = await prisma.class.findMany({
        where: { id: { in: classIds }, schoolId }
      })

      const classNames = classes.map(c => c.name)

      // Count students per class name (since Student model uses `class String`)
      const studentCounts = await prisma.student.groupBy({
        by: ['class'],
        where: { class: { in: classNames }, schoolId },
        _count: { id: true }
      })

      const result = classes.map(c => {
        const count = studentCounts.find(sc => sc.class === c.name)?._count.id || 0
        return {
          id: c.id,
          name: c.name,
          section: c.section,
          strength: count
        }
      })

      return { success: true, data: result }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}