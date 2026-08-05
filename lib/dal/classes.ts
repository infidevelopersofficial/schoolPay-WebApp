import { withTenantRead } from "@/lib/dal/core"
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
  classTeacherId: z.string().optional(),
  room: z.string().optional(),
  capacity: z.coerce.number().default(40),
})

export type CreateClassInput = z.infer<typeof createClassSchema>

export async function getClasses() {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
  return withDAL(
    "classes.getAll",
    () =>
      prisma.class.findMany({
        where: { schoolId },
        orderBy: [{ name: "asc" }, { section: "asc" }],
        include: { classTeacher: { select: { name: true } } },
      }),
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
  })
}

export async function getClass(id: string) {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
    return withDAL(
      "classes.getOne",
      () =>
        prisma.class.findUnique({
          where: { id },
          include: { classTeacher: { select: { id: true, name: true } } },
        }).then((cls) => {
          if (cls && cls.schoolId !== schoolId) return null
          return cls
        }),
      { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
    )
  })
}

export async function getClassDetail(id: string) {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
    return withDAL(
      "classes.getDetail",
      async () => {
        const cls = await prisma.class.findUnique({
          where: { id },
          include: { 
            classTeacher: { select: { id: true, name: true } },
            teacherClassAssignments: { include: { teacher: { select: { id: true, name: true } } } }
          },
        })
        
        if (!cls || cls.schoolId !== schoolId) return null

        const students = await prisma.student.findMany({
          where: {
            schoolId,
            class: cls.name,
            section: cls.section
          },
          select: { id: true, name: true, studentId: true, rollNumber: true }
        })

        return { ...cls, students }
      },
      { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
    )
  })
}

import { setClassTeacher } from "./teachers"

export async function createClass(input: CreateClassInput) {
  const schoolId = await getSchoolId()
  const validated = createClassSchema.parse(input)
  return withDAL(
    "classes.create",
    async () => {
      const { classTeacherId, classTeacher, ...rest } = validated
      
      const cls = await prisma.class.create({ 
        data: { 
          ...rest, 
          schoolId 
        } 
      })

      let targetTeacherId = classTeacherId;
      if (!targetTeacherId && classTeacher) {
        const tObj = await prisma.teacher.findFirst({
          where: {
            schoolId,
            OR: [
              { id: classTeacher },
              { name: { equals: classTeacher, mode: "insensitive" } }
            ]
          }
        });
        if (tObj) targetTeacherId = tObj.id;
      }

      if (targetTeacherId) {
        await setClassTeacher(cls.id, targetTeacherId)
      }

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

      const { classTeacherId, classTeacher, ...rest } = data
      
      const cls = await prisma.class.update({ 
        where: { id }, 
        data: rest
      })

      let targetTeacherId = classTeacherId;
      if (targetTeacherId === undefined && classTeacher) {
        const tObj = await prisma.teacher.findFirst({
          where: {
            schoolId,
            OR: [
              { id: classTeacher },
              { name: { equals: classTeacher, mode: "insensitive" } }
            ]
          }
        });
        if (tObj) targetTeacherId = tObj.id;
      }

      if (targetTeacherId !== undefined) {
        await setClassTeacher(cls.id, targetTeacherId)
      }

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
export async function deleteClass(id: string) { const schoolId = await getSchoolId(); return withDAL('classes.delete', async () => { const oldData = await prisma.class.findUnique({ where: { id } }); if (oldData?.schoolId !== schoolId) throw new Error('Class not found'); await prisma.class.delete({ where: { id } }); await recordAuditLog({ action: 'SOFT_DELETE', entityType: 'CLASS', entityId: id, schoolId, oldValues: oldData }); return { success: true }; }); }
