import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { recordAuditLog } from "@/lib/audit"
import { withDAL } from "@/lib/dal/utils"
import { getSchoolId } from "@/lib/tenant-context"
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
  const schoolId = await getSchoolId()
  return withDAL(
    "classes.getAll",
    () =>
      prisma.class.findMany({
        where: { schoolId },
        orderBy: [{ name: "asc" }, { section: "asc" }],
      }),
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function createClass(input: CreateClassInput) {
  const schoolId = await getSchoolId()
  const validated = createClassSchema.parse(input)
  return withDAL(
    "classes.create",
    async () => {
      const cls = await prisma.class.create({ data: { ...validated, schoolId } })

      await recordAuditLog({
        action: "CREATE",
        entityType: "CLASS",
        entityId: cls.id,
        schoolId,
        newValues: validated,
        description: `Created class ${cls.name}-${cls.section}`,
      })

      return cls
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function updateClass(id: string, data: Partial<CreateClassInput>) {
  const schoolId = await getSchoolId()
  return withDAL(
    "classes.update",
    async () => {
      const oldData = await prisma.class.findUnique({ where: { id } })
      if (oldData?.schoolId !== schoolId) throw new Error("Class not found")

      const cls = await prisma.class.update({ where: { id }, data })

      await recordAuditLog({
        action: "UPDATE",
        entityType: "CLASS",
        entityId: id,
        schoolId,
        oldValues: { name: oldData?.name, section: oldData?.section },
        newValues: { name: cls.name, section: cls.section },
        description: `Updated class ${cls.name}-${cls.section}`,
      })

      return cls
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}
