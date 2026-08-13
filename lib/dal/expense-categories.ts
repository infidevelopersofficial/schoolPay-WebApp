import { prisma } from "@/lib/prisma"
import { withDAL } from "@/lib/dal/utils"
import { withTenantRead } from "@/lib/dal/core"
import { THRESHOLDS } from "@/lib/observability/performance"
import { logger } from "@/lib/logger"
import { getSchoolId } from "@/lib/tenant-context"

const log = logger.child({ domain: "expenses" })

export async function getExpenseCategories() {
  return await withTenantRead(async (schoolId) => {
    return withDAL(
      "expenseCategories.getAll",
      () =>
        prisma.expenseCategory.findMany({
          where: { schoolId, isActive: true },
          orderBy: { name: 'asc' },
        }),
      { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY }
    )
  })
}

export async function createExpenseCategory(name: string) {
  const schoolId = await getSchoolId()
  if (!schoolId) throw new Error("No school selected")
  
  const trimmedName = name.trim()
  if (!trimmedName) throw new Error("Category name is required")

  return withDAL(
    "expenseCategories.create",
    async () => {
      // Check for exact duplicate first to give a nicer error than Prisma unique constraint
      const existing = await prisma.expenseCategory.findUnique({
        where: {
          schoolId_name: {
            schoolId,
            name: trimmedName,
          }
        }
      })
      if (existing) {
        if (existing.isActive) throw new Error("A category with this name already exists.")
        // If it was soft-deleted, we just restore it
        return prisma.expenseCategory.update({
          where: { id: existing.id },
          data: { isActive: true }
        })
      }

      return prisma.expenseCategory.create({
        data: {
          schoolId,
          name: trimmedName,
          isActive: true
        }
      })
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY }
  )
}

export async function deleteExpenseCategory(id: string) {
  const schoolId = await getSchoolId()
  if (!schoolId) throw new Error("No school selected")

  return withDAL(
    "expenseCategories.delete",
    async () => {
      // Verify tenant ownership
      const category = await prisma.expenseCategory.findUnique({
        where: { id }
      })
      if (!category || category.schoolId !== schoolId) {
        throw new Error("Category not found")
      }

      return prisma.expenseCategory.update({
        where: { id },
        data: { isActive: false }
      })
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY }
  )
}
