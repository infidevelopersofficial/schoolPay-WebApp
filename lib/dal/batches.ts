import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { recordAuditLog } from "@/lib/audit"
import { withDAL } from "@/lib/dal/utils"
import { getSchoolId } from "@/lib/tenant-context"
import { logger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"

const log = logger.child({ domain: "batches" })

// ──────────────────────────────────────────────
// Validation Schemas
// ──────────────────────────────────────────────

export const createBatchSchema = z.object({
  name: z.string().min(1, "Batch name is required"),
  code: z.string().optional(),
  grade: z.string().optional(),
  section: z.string().optional(),
  subjectFocus: z.string().optional(),
  // schedule: [{day: "MON", startTime: "09:00", durationMins: 90}]
  schedule: z.array(z.object({
    day: z.string(),
    startTime: z.string(),
    durationMins: z.number(),
  })).optional(),
  capacity: z.coerce.number().default(40),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  teacherId: z.string().optional(),
})

export type CreateBatchInput = z.infer<typeof createBatchSchema>

// ──────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────

export async function getBatches(opts?: { isActive?: boolean; teacherId?: string }) {
  const schoolId = await getSchoolId()
  const { isActive = true, teacherId } = opts ?? {}
  return withDAL(
    "batches.getAll",
    () =>
      prisma.batch.findMany({
        where: {
          schoolId,
          ...(isActive !== undefined && { isActive }),
          ...(teacherId && { teacherId }),
        },
        orderBy: { createdAt: "desc" },
        include: {
          teacher: { select: { name: true, subject: true } },
          _count: { select: { enrollments: true } },
        },
      }),
    { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
  )
}

export async function getBatch(id: string) {
  const schoolId = await getSchoolId()
  return withDAL(
    "batches.getOne",
    () =>
      prisma.batch.findUnique({
        where: { id },
        include: {
          teacher: { select: { name: true, subject: true } },
          enrollments: {
            include: { student: { select: { id: true, name: true, class: true, feeStatus: true } } },
            where: { status: "ACTIVE" },
          },
        },
      }).then((batch) => {
        if (batch && batch.schoolId !== schoolId) return null
        return batch
      }),
    { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
  )
}

// ──────────────────────────────────────────────
// Mutations
// ──────────────────────────────────────────────

export async function createBatch(input: CreateBatchInput) {
  const schoolId = await getSchoolId()
  const validated = createBatchSchema.parse(input)
  return withDAL(
    "batches.create",
    async () => {
      const batch = await prisma.batch.create({
        data: {
          ...validated,
          schoolId,
          startDate: validated.startDate ? new Date(validated.startDate) : undefined,
          endDate: validated.endDate ? new Date(validated.endDate) : undefined,
        },
      })

      await recordAuditLog({
        action: "CREATE",
        entityType: "CLASS",    // reuse CLASS entity type for audit
        entityId: batch.id,
        schoolId,
        newValues: validated,
        description: `Created batch: ${batch.name}`,
      })

      return batch
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function updateBatch(id: string, data: Partial<CreateBatchInput>) {
  const schoolId = await getSchoolId()
  return withDAL(
    "batches.update",
    async () => {
      const oldData = await prisma.batch.findUnique({ where: { id } })
      if (oldData?.schoolId !== schoolId) throw new Error("Batch not found")

      const batch = await prisma.batch.update({
        where: { id },
        data: {
          ...data,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
        },
      })

      await recordAuditLog({
        action: "UPDATE",
        entityType: "CLASS",
        entityId: id,
        schoolId,
        oldValues: { name: oldData?.name },
        newValues: { name: batch.name },
        description: `Updated batch: ${batch.name}`,
      })

      return batch
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function deactivateBatch(id: string) {
  const schoolId = await getSchoolId()
  return withDAL(
    "batches.deactivate",
    async () => {
      const existing = await prisma.batch.findUnique({ where: { id } })
      if (existing?.schoolId !== schoolId) throw new Error("Batch not found")

      const batch = await prisma.batch.update({
        where: { id },
        data: { isActive: false },
      })

      await recordAuditLog({
        action: "SOFT_DELETE",
        entityType: "CLASS",
        entityId: id,
        schoolId,
        description: `Deactivated batch: ${batch.name}`,
      })

      return batch
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}
