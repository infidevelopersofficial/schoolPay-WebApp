import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { recordAuditLog } from "@/lib/audit"
import { withDAL } from "@/lib/dal/utils"
import { getSchoolId } from "@/lib/tenant-context"
import { logger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"

const log = logger.child({ domain: "teachers" })

export const createTeacherSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(1, "Phone is required"),
  subject: z.string().min(1, "Subject is required"),
  class: z.string().min(1, "Class is required"),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  qualification: z.string().optional(),
  experience: z.string().optional(),
  joiningDate: z.string().optional(),
  salary: z.coerce.number().optional(),
})

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>

export async function getTeachers(opts?: {
  page?: number
  limit?: number
  search?: string
  subject?: string
}) {
  const schoolId = await getSchoolId()
  const { page = 1, limit = 50, search, subject } = opts ?? {}
  const where = {
    schoolId,
    isActive: true,
    ...(search && { name: { contains: search, mode: "insensitive" as const } }),
    ...(subject && { subject }),
  }
  return withDAL(
    "teachers.getAll",
    () =>
      Promise.all([
        prisma.teacher.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.teacher.count({ where }),
      ]).then(([teachers, total]) => ({
        teachers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      })),
    { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
  )
}

export async function getTeacher(id: string) {
  const schoolId = await getSchoolId()
  return withDAL(
    "teachers.getOne",
    () =>
      prisma.teacher.findUnique({
        where: { id },
        include: { lessons: true, exams: true },
      }).then((teacher) => {
        if (teacher && teacher.schoolId !== schoolId) return null
        return teacher
      }),
    { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
  )
}

export async function createTeacher(input: CreateTeacherInput) {
  const schoolId = await getSchoolId()
  const validated = createTeacherSchema.parse(input)
  return withDAL(
    "teachers.create",
    async () => {
      const teacher = await prisma.teacher.create({
        data: {
          ...validated,
          schoolId,
          dateOfBirth: validated.dateOfBirth ? new Date(validated.dateOfBirth) : undefined,
          joiningDate: validated.joiningDate ? new Date(validated.joiningDate) : new Date(),
        },
      })

      await recordAuditLog({
        action: "CREATE",
        entityType: "TEACHER",
        entityId: teacher.id,
        schoolId,
        newValues: validated,
        description: `Registered teacher: ${teacher.name}`,
      })

      return teacher
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function updateTeacher(id: string, data: Partial<CreateTeacherInput>) {
  const schoolId = await getSchoolId()
  return withDAL(
    "teachers.update",
    async () => {
      const oldData = await prisma.teacher.findUnique({ where: { id } })
      if (oldData?.schoolId !== schoolId) throw new Error("Teacher not found")

      const teacher = await prisma.teacher.update({ where: { id }, data })

      await recordAuditLog({
        action: "UPDATE",
        entityType: "TEACHER",
        entityId: id,
        schoolId,
        oldValues: { name: oldData?.name, subject: oldData?.subject },
        newValues: { name: teacher.name, subject: teacher.subject },
        description: `Updated teacher: ${teacher.name}`,
      })

      return teacher
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function deleteTeacher(id: string) {
  const schoolId = await getSchoolId()
  return withDAL(
    "teachers.delete",
    async () => {
      const existing = await prisma.teacher.findUnique({ where: { id } })
      if (existing?.schoolId !== schoolId) throw new Error("Teacher not found")

      const teacher = await prisma.teacher.update({
        where: { id },
        data: { isActive: false },
      })

      await recordAuditLog({
        action: "SOFT_DELETE",
        entityType: "TEACHER",
        entityId: id,
        schoolId,
        description: `Archived teacher: ${teacher.name}`,
      })

      return teacher
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}
