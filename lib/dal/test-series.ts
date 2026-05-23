import { withTenantRead } from "@/lib/dal/core"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { recordAuditLog } from "@/lib/audit"
import { withDAL } from "@/lib/dal/utils"
import { getSchoolId } from "@/lib/tenant-context"
import { logger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"

const log = logger.child({ domain: "testSeries" })

export const createTestSeriesSchema = z.object({
  name: z.string().min(1, "Name is required"),
  course: z.string().min(1, "Course is required"),
  scheduleStartDate: z.string().min(1, "Start date is required"),
  scheduleEndDate: z.string().optional(),
  testCount: z.coerce.number().min(1),
  totalMarks: z.coerce.number().min(1),
  passingMarks: z.coerce.number().optional(),
})

export type CreateTestSeriesInput = z.infer<typeof createTestSeriesSchema>

export async function getTestSeries() {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
  return withDAL(
    "testSeries.getAll",
    () =>
      prisma.testSeries.findMany({
        where: { schoolId },
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { tests: true, attempts: true } }
        }
      }),
    { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY }
  )
  })
}

export async function createTestSeries(input: CreateTestSeriesInput) {
  const schoolId = await getSchoolId()
  const validated = createTestSeriesSchema.parse(input)

  return withDAL(
    "testSeries.create",
    async () => {
      const series = await prisma.testSeries.create({
        data: {
          ...validated,
          schoolId,
          scheduleStartDate: new Date(validated.scheduleStartDate),
          scheduleEndDate: validated.scheduleEndDate ? new Date(validated.scheduleEndDate) : undefined,
        }
      })

      await recordAuditLog({
        action: "CREATE",
        entityType: "CLASS", // No specific enum for TestSeries, fallback
        entityId: series.id,
        schoolId,
        newValues: validated,
        description: `Created Test Series: ${series.name}`
      })

      return series
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY }
  )
}
