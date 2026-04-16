import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { recordAuditLog } from "@/lib/audit"
import { withDAL } from "@/lib/dal/utils"
import { logger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"

const log = logger.child({ domain: "classes" })

export const createClassSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  section: z.string().min(1, "Section is required"),
  classTeacher: z.string().optional(),
  room: z.string().optional(),
  capacity: z.coerce.number().default(40),
})

export type CreateClassInput = z.infer<typeof createClassSchema>

export async function getClasses() {
  return withDAL(
    "classes.getAll",
    () => prisma.class.findMany({ orderBy: [{ name: "asc" }, { section: "asc" }] }),
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function createClass(input: CreateClassInput) {
  const validated = createClassSchema.parse(input)
  return withDAL(
    "classes.create",
    async () => {
      const cls = await prisma.class.create({ data: validated })

      await recordAuditLog({
        action: "CREATE",
        entityType: "CLASS",
        entityId: cls.id,
        newValues: validated,
        description: `Created class ${cls.name}-${cls.section}`,
      })

      return cls
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function updateClass(id: string, data: Partial<CreateClassInput>) {
  return withDAL(
    "classes.update",
    async () => {
      const oldData = await prisma.class.findUnique({ where: { id } })

      const cls = await prisma.class.update({ where: { id }, data })

      await recordAuditLog({
        action: "UPDATE",
        entityType: "CLASS",
        entityId: id,
        oldValues: { name: oldData?.name, section: oldData?.section },
        newValues: { name: cls.name, section: cls.section },
        description: `Updated class ${cls.name}-${cls.section}`,
      })

      return cls
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}
