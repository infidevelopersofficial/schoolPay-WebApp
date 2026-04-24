import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { recordAuditLog } from "@/lib/audit"
import { withDAL } from "@/lib/dal/utils"
import { getSchoolId } from "@/lib/tenant-context"
import { logger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"

const log = logger.child({ domain: "parents" })

export const createParentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(1, "Phone is required"),
  relationship: z.string().optional(),
  occupation: z.string().optional(),
  address: z.string().optional(),
})

export type CreateParentInput = z.infer<typeof createParentSchema>

export async function getParents(opts?: {
  page?: number
  limit?: number
  search?: string
}) {
  const schoolId = await getSchoolId()
  const { page = 1, limit = 50, search } = opts ?? {}
  const where: any = {
    schoolId,
    isActive: true,
    ...(search && { name: { contains: search, mode: "insensitive" as const } }),
  }
  return withDAL(
    "parents.getAll",
    () =>
      Promise.all([
        prisma.parent.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: { students: { select: { id: true, name: true, class: true } } },
        }),
        prisma.parent.count({ where }),
      ]).then(([parents, total]) => ({
        parents,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      })),
    { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
  )
}

export async function createParent(input: CreateParentInput) {
  const schoolId = await getSchoolId()
  const validated = createParentSchema.parse(input)
  return withDAL(
    "parents.create",
    async () => {
      const parent = await prisma.parent.create({ data: { ...validated, schoolId } })

      await recordAuditLog({
        action: "CREATE",
        entityType: "PARENT",
        entityId: parent.id,
        schoolId,
        newValues: validated,
        description: `Registered parent: ${parent.name}`,
      })

      return parent
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function updateParent(id: string, data: Partial<CreateParentInput>) {
  const schoolId = await getSchoolId()
  return withDAL(
    "parents.update",
    async () => {
      const oldData = await prisma.parent.findUnique({ where: { id } })
      if (oldData?.schoolId !== schoolId) throw new Error("Parent not found")

      const parent = await prisma.parent.update({ where: { id }, data })

      await recordAuditLog({
        action: "UPDATE",
        entityType: "PARENT",
        entityId: id,
        schoolId,
        oldValues: { name: oldData?.name, email: oldData?.email },
        newValues: { name: parent.name, email: parent.email },
        description: `Updated parent: ${parent.name}`,
      })

      return parent
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function deleteParent(id: string) {
  const schoolId = await getSchoolId()
  return withDAL(
    "parents.delete",
    async () => {
      const existing = await prisma.parent.findUnique({ where: { id } })
      if (existing?.schoolId !== schoolId) throw new Error("Parent not found")

      const parent = await prisma.parent.update({
        where: { id },
        data: { isActive: false },
      })

      await recordAuditLog({
        action: "SOFT_DELETE",
        entityType: "PARENT",
        entityId: id,
        schoolId,
        description: `Archived parent: ${parent.name}`,
      })

      return parent
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}
