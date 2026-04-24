import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { recordAuditLog } from "@/lib/audit"
import { withDAL } from "@/lib/dal/utils"
import { getSchoolId } from "@/lib/tenant-context"
import { logger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"

const log = logger.child({ domain: "fees" })

export const createFeeSchema = z.object({
  type: z.string().min(1, "Fee type is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  description: z.string().min(1, "Description is required"),
  frequency: z.enum(["MONTHLY", "QUARTERLY", "YEARLY", "ONE_TIME"]),
  dueDate: z.string().optional(),
})

export type CreateFeeInput = z.infer<typeof createFeeSchema>

export async function getFees() {
  const schoolId = await getSchoolId()
  return withDAL(
    "fees.getAll",
    () =>
      prisma.fee.findMany({
        where: { schoolId, isActive: true },
        orderBy: { createdAt: "desc" },
      }),
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function createFee(input: CreateFeeInput) {
  const schoolId = await getSchoolId()
  const validated = createFeeSchema.parse(input)
  return withDAL(
    "fees.create",
    async () => {
      const fee = await prisma.fee.create({ data: { ...validated, schoolId } })

      await recordAuditLog({
        action: "CREATE",
        entityType: "FEE",
        entityId: fee.id,
        schoolId,
        newValues: validated,
        description: `Created fee structure: ${fee.type} (${fee.frequency})`,
      })

      return fee
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function updateFee(id: string, data: Partial<CreateFeeInput>) {
  const schoolId = await getSchoolId()
  return withDAL(
    "fees.update",
    async () => {
      const oldData = await prisma.fee.findUnique({ where: { id } })
      if (oldData?.schoolId !== schoolId) throw new Error("Fee not found")

      const fee = await prisma.fee.update({ where: { id }, data })

      await recordAuditLog({
        action: "UPDATE",
        entityType: "FEE",
        entityId: id,
        schoolId,
        oldValues: { type: oldData?.type, amount: oldData?.amount },
        newValues: { type: fee.type, amount: fee.amount },
        description: `Updated fee: ${fee.type}`,
      })

      return fee
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function deleteFee(id: string) {
  const schoolId = await getSchoolId()
  return withDAL(
    "fees.delete",
    async () => {
      const existing = await prisma.fee.findUnique({ where: { id } })
      if (existing?.schoolId !== schoolId) throw new Error("Fee not found")

      const fee = await prisma.fee.update({ where: { id }, data: { isActive: false } })

      await recordAuditLog({
        action: "SOFT_DELETE",
        entityType: "FEE",
        entityId: id,
        schoolId,
        description: `Deactivated fee: ${fee.type}`,
      })

      return fee
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}
