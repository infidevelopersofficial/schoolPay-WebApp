import { withTenantRead } from "@/lib/dal/core"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { recordAuditLog } from "@/lib/audit"
import { withDAL } from "@/lib/dal/utils"
import { getSchoolId } from "@/lib/tenant-context"
import { logger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"

const log = logger.child({ domain: "fee-structure" })

export const createFeeStructureSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  items: z.array(
    z.object({
      name: z.string().min(1, "Item name is required"),
      amount: z.coerce.number().positive("Amount must be positive"), // paise
      frequency: z.enum(["MONTHLY", "QUARTERLY", "YEARLY", "ONE_TIME"]),
      gstRate: z.coerce.number().min(0).optional().default(0),
    })
  ).min(1, "At least one fee item is required"),
  classIds: z.array(z.string()).min(1, "At least one class must be selected"),
  sessionId: z.string().min(1, "Academic session is required"),
})

export type CreateFeeStructureInput = z.infer<typeof createFeeStructureSchema>

export async function getFeeStructures() {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
    return withDAL(
      "feeStructures.getAll",
      () =>
        prisma.feeStructure.findMany({
          where: { schoolId, isActive: true },
          include: {
            items: true,
            mappings: {
              include: {
                class: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
      { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
    )
  })
}

export async function createFeeStructureWithMappings(input: CreateFeeStructureInput) {
  const schoolId = await getSchoolId()
  const validated = createFeeStructureSchema.parse(input)
  
  return withDAL(
    "feeStructures.createWizard",
    async () => {
      // Use interactive transaction to ensure structure, items, and mappings are created atomically
      const result = await prisma.$transaction(async (tx) => {
        const structure = await tx.feeStructure.create({
          data: {
            name: validated.name,
            description: validated.description,
            schoolId,
            items: {
              create: validated.items.map((item) => ({
                name: item.name,
                amount: item.amount,
                frequency: item.frequency,
                gstRate: item.gstRate,
              })),
            },
            mappings: {
              create: validated.classIds.map((classId) => ({
                classId,
                sessionId: validated.sessionId,
                schoolId,
              })),
            },
          },
          include: {
            items: true,
            mappings: true,
          },
        })

        await recordAuditLog({
          action: "CREATE",
          entityType: "FEE_STRUCTURE",
          entityId: structure.id,
          schoolId,
          newValues: validated,
          description: `Created fee structure: ${structure.name}`,
        })

        return structure
      })

      return result
    },
    { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
  )
}

export async function getFeeStructureById(id: string) {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
    return withDAL(
      "feeStructures.getById",
      () =>
        prisma.feeStructure.findUnique({
          where: { id, schoolId },
          include: { items: true, mappings: { include: { class: true } } },
        }),
      { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
    )
  })
}

export async function deleteFeeStructure(id: string) {
  const schoolId = await getSchoolId()
  return withDAL(
    "feeStructures.delete",
    async () => {
      const structure = await prisma.feeStructure.findUnique({
        where: { id },
        include: { items: true }
      })

      if (!structure || structure.schoolId !== schoolId) {
        throw new Error("Fee structure not found or unauthorized")
      }

      const itemIds = structure.items.map(i => i.id)

      const mappingsWithInvoices = await prisma.studentFeeMapping.findFirst({
        where: {
          feeItemId: { in: itemIds }
        }
      })

      if (mappingsWithInvoices) {
          throw new Error("Cannot delete fee structure: Invoices or payments have already been generated for it.")
      }

      const updated = await prisma.feeStructure.update({
        where: { id },
        data: { isActive: false },
      })

      await recordAuditLog({
        action: "SOFT_DELETE",
        entityType: "FEE_STRUCTURE",
        entityId: id,
        schoolId,
        description: `Archived fee structure: ${structure.name}`,
      })

      return updated
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function getFeeStructureDetail(id: string) {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
    return withDAL(
      "feeStructures.getDetail",
      async () => {
        const structure = await prisma.feeStructure.findUnique({
          where: { id, schoolId },
          include: { 
            items: true, 
            mappings: { include: { class: true } } 
          },
        })

        if (!structure) return null

        const itemIds = structure.items.map(i => i.id)

        // Aggregate StudentFeeMapping statuses
        const aggregations = await prisma.studentFeeMapping.groupBy({
          by: ['status'],
          where: { feeItemId: { in: itemIds }, schoolId },
          _count: { id: true },
          _sum: { amount: true }
        })

        let totalAssigned = 0
        let totalExpected = 0
        let totalCollected = 0
        
        const statusCounts = {
          PAID: 0,
          PENDING: 0,
          OVERDUE: 0,
          PARTIAL: 0
        }

        for (const agg of aggregations) {
          const count = agg._count.id
          const sum = agg._sum.amount || 0
          
          totalAssigned += count
          totalExpected += sum
          
          if (agg.status in statusCounts) {
            statusCounts[agg.status as keyof typeof statusCounts] += count
          }
          
          if (agg.status === 'PAID') {
            totalCollected += sum
          } else if (agg.status === 'PARTIAL') {
            // PARTIAL implies some amount is paid, but the DB only stores total expected amount in this record.
            // Actual collected amount for partials would require joining Payments.
            // For now, we only count fully PAID towards totalCollected from mapping sum.
            // If they need exact partial sums, we'd query payments.
          }
        }

        return {
          ...structure,
          metrics: {
            totalAssigned,
            totalExpected,
            totalCollected,
            statusCounts
          }
        }
      },
      { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
    )
  })
}
