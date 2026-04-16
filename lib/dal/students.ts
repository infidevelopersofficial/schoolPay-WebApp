import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { recordAuditLog } from "@/lib/audit"
import { withDAL } from "@/lib/dal/utils"
import { logger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"

const log = logger.child({ domain: "students" })

// ──────────────────────────────────────────────
// Validation Schemas
// ──────────────────────────────────────────────

export const createStudentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  class: z.string().min(1, "Class is required"),
  section: z.string().optional(),
  rollNumber: z.string().optional(),
  bloodGroup: z.string().optional(),
  emergencyContact: z.string().optional(),
  parentId: z.string().optional(),
  totalFees: z.coerce.number().default(0),
})

export type CreateStudentInput = z.infer<typeof createStudentSchema>

// ──────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────

export async function getStudents(opts?: {
  page?: number
  limit?: number
  search?: string
  classFilter?: string
  feeStatus?: string
  sortBy?: string
  sortDir?: "asc" | "desc"
}) {
  const { page = 1, limit = 50, search, classFilter, feeStatus, sortBy, sortDir } = opts ?? {}

  const where = {
    ...(search && { name: { contains: search, mode: "insensitive" as const } }),
    ...(classFilter && { class: classFilter }),
    ...(feeStatus && { feeStatus: feeStatus as any }),
    isActive: true,
  }

  const orderBy: any = sortBy && sortDir ? { [sortBy]: sortDir } : { createdAt: "desc" }

  return withDAL(
    "students.getAll",
    () =>
      Promise.all([
        prisma.student.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy,
          include: { parent: { select: { name: true } } },
        }),
        prisma.student.count({ where }),
      ]).then(([students, total]) => ({
        students,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      })),
    { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
  )
}

export async function getStudent(id: string) {
  return withDAL(
    "students.getOne",
    () =>
      prisma.student.findUnique({
        where: { id },
        include: {
          parent: true,
          payments: { orderBy: { date: "desc" }, take: 10 },
          attendance: { orderBy: { date: "desc" }, take: 30 },
          results: { orderBy: { createdAt: "desc" } },
        },
      }),
    { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
  )
}

// ──────────────────────────────────────────────
// Mutations
// ──────────────────────────────────────────────

export async function createStudent(input: CreateStudentInput) {
  const validated = createStudentSchema.parse(input)

  return withDAL(
    "students.create",
    async () => {
      const student = await prisma.student.create({
        data: {
          ...validated,
          feeStatus: "PENDING",
          paidAmount: 0,
          pendingAmount: validated.totalFees,
          dateOfBirth: validated.dateOfBirth ? new Date(validated.dateOfBirth) : undefined,
          admissionDate: new Date(),
        },
      })

      await recordAuditLog({
        action: "CREATE",
        entityType: "STUDENT",
        entityId: student.id,
        newValues: validated,
        description: `Registered student: ${student.name}`,
      })

      return student
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function updateStudent(id: string, data: Partial<CreateStudentInput>) {
  return withDAL(
    "students.update",
    async () => {
      const oldData = await prisma.student.findUnique({ where: { id } })

      const updated = await prisma.student.update({
        where: { id },
        data: {
          ...data,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        },
      })

      await recordAuditLog({
        action: "UPDATE",
        entityType: "STUDENT",
        entityId: id,
        oldValues: { name: oldData?.name, class: oldData?.class },
        newValues: { name: updated.name, class: updated.class },
        description: `Updated student: ${updated.name}`,
      })

      return updated
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function deleteStudent(id: string) {
  return withDAL(
    "students.delete",
    async () => {
      const student = await prisma.student.update({
        where: { id },
        data: { isActive: false },
      })

      await recordAuditLog({
        action: "SOFT_DELETE",
        entityType: "STUDENT",
        entityId: id,
        description: `Soft deleted student: ${student.name}`,
      })

      return student
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}
