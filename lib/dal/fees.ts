import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { recordAuditLog } from "@/lib/audit"
import { withDAL } from "@/lib/dal/utils"
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
  return withDAL(
    "fees.getAll",
    () => prisma.fee.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" } }),
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function createFee(input: CreateFeeInput) {
  const validated = createFeeSchema.parse(input)
  return withDAL(
    "fees.create",
    async () => {
      const fee = await prisma.fee.create({ data: validated })

      await recordAuditLog({
        action: "CREATE",
        entityType: "FEE",
        entityId: fee.id,
        newValues: validated,
        description: `Created fee structure: ${fee.type} (${fee.frequency})`,
      })

      return fee
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function updateFee(id: string, data: Partial<CreateFeeInput>) {
  return withDAL(
    "fees.update",
    async () => {
      const oldData = await prisma.fee.findUnique({ where: { id } })

      const fee = await prisma.fee.update({ where: { id }, data })

      await recordAuditLog({
        action: "UPDATE",
        entityType: "FEE",
        entityId: id,
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
  return withDAL(
    "fees.delete",
    async () => {
      const fee = await prisma.fee.update({ where: { id }, data: { isActive: false } })

      await recordAuditLog({
        action: "SOFT_DELETE",
        entityType: "FEE",
        entityId: id,
        description: `Deactivated fee: ${fee.type}`,
      })

      return fee
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}
