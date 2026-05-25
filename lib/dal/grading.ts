import { withTenantRead } from "@/lib/dal/core"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { recordAuditLog } from "@/lib/audit"
import { withDAL } from "@/lib/dal/utils"
import { getSchoolId } from "@/lib/tenant-context"
import { logger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"

const log = logger.child({ domain: "grading" })

export const createGradingSchemeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  bands: z.array(z.object({
    name: z.string().min(1),
    minMarks: z.coerce.number().min(0),
    maxMarks: z.coerce.number().positive(),
    points: z.coerce.number().optional(),
    remarksTemplate: z.string().optional(),
  })).min(1),
})

export async function getGradingSchemes() {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
    return withDAL(
      "grading.getAll",
      () =>
        prisma.gradingScheme.findMany({
          where: { schoolId },
          include: { bands: { orderBy: { minMarks: 'desc' } } },
        }),
      { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
    )
  })
}

export async function createGradingScheme(input: z.infer<typeof createGradingSchemeSchema>) {
  const schoolId = await getSchoolId()
  const validated = createGradingSchemeSchema.parse(input)
  
  return withDAL(
    "grading.create",
    async () => {
      return await prisma.$transaction(async (tx) => {
        const scheme = await tx.gradingScheme.create({
          data: {
            schoolId,
            name: validated.name,
            description: validated.description,
            bands: {
              create: validated.bands.map(b => ({
                name: b.name,
                minMarks: b.minMarks,
                maxMarks: b.maxMarks,
                points: b.points,
                remarksTemplate: b.remarksTemplate,
              }))
            }
          },
          include: { bands: true }
        })

        await recordAuditLog({
          action: "CREATE",
          entityType: "GRADING_SCHEME",
          entityId: scheme.id,
          schoolId,
          newValues: { name: validated.name, bandsCount: validated.bands.length },
          description: `Created grading scheme: ${scheme.name}`,
        })

        return scheme
      })
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function computeGrade(examGroupId: string, marks: number, maxMarks: number): Promise<string | null> {
  const schoolId = await getSchoolId()
  // Fetch scheme
  const group = await prisma.examGroup.findUnique({
    where: { id: examGroupId, schoolId },
    include: { gradingScheme: { include: { bands: true } } }
  })
  
  if (!group || !group.gradingScheme) return null

  // Calculate percentage
  const percentage = (marks / maxMarks) * 100

  // Find matching band
  const matched = group.gradingScheme.bands.find(
    b => percentage >= b.minMarks && percentage <= b.maxMarks
  )
  
  return matched ? matched.name : null
}
