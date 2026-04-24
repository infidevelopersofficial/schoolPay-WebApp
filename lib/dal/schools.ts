import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { recordAuditLog } from "@/lib/audit"
import { withDAL } from "@/lib/dal/utils"
import { logger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"

const log = logger.child({ domain: "schools" })

// ──────────────────────────────────────────────
// Validation Schemas
// ──────────────────────────────────────────────

export const createSchoolSchema = z.object({
  name: z.string().min(1, "School name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  logo: z.string().optional(),
  timezone: z.string().default("Asia/Kolkata"),
  currency: z.string().default("INR"),
})

export type CreateSchoolInput = z.infer<typeof createSchoolSchema>

// ──────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────

/**
 * List all schools (SUPER_ADMIN only).
 */
export async function getSchools(opts?: {
  page?: number
  limit?: number
  search?: string
}) {
  const { page = 1, limit = 50, search } = opts ?? {}
  const where = {
    isActive: true,
    ...(search && { name: { contains: search, mode: "insensitive" as const } }),
  }

  return withDAL(
    "schools.getAll",
    () =>
      Promise.all([
        prisma.school.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            _count: {
              select: {
                students: true,
                teachers: true,
                users: true,
              },
            },
          },
        }),
        prisma.school.count({ where }),
      ]).then(([schools, total]) => ({
        schools,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      })),
    { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
  )
}

/**
 * Get a single school by ID with stats.
 */
export async function getSchool(id: string) {
  return withDAL(
    "schools.getOne",
    () =>
      prisma.school.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              students: true,
              teachers: true,
              parents: true,
              users: true,
              payments: true,
            },
          },
        },
      }),
    { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
  )
}

/**
 * Get all schools a specific user belongs to.
 */
export async function getSchoolsForUser(userId: string) {
  return withDAL(
    "schools.forUser",
    () =>
      prisma.userSchool.findMany({
        where: { userId },
        include: {
          school: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              address: true,
              isActive: true,
            },
          },
        },
      }),
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

// ──────────────────────────────────────────────
// Mutations
// ──────────────────────────────────────────────

/**
 * Create a new school (tenant).
 */
export async function createSchool(input: CreateSchoolInput) {
  const validated = createSchoolSchema.parse(input)

  return withDAL(
    "schools.create",
    async () => {
      const school = await prisma.school.create({ data: validated })

      await recordAuditLog({
        action: "CREATE",
        entityType: "SCHOOL",
        entityId: school.id,
        newValues: validated,
        description: `Created school: ${school.name}`,
      })

      return school
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

/**
 * Update an existing school.
 */
export async function updateSchool(id: string, data: Partial<CreateSchoolInput>) {
  return withDAL(
    "schools.update",
    async () => {
      const oldData = await prisma.school.findUnique({ where: { id } })

      const school = await prisma.school.update({ where: { id }, data })

      await recordAuditLog({
        action: "UPDATE",
        entityType: "SCHOOL",
        entityId: id,
        oldValues: { name: oldData?.name, slug: oldData?.slug },
        newValues: { name: school.name, slug: school.slug },
        description: `Updated school: ${school.name}`,
      })

      return school
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

/**
 * Soft-delete a school by deactivating it.
 */
export async function deactivateSchool(id: string) {
  return withDAL(
    "schools.deactivate",
    async () => {
      const school = await prisma.school.update({
        where: { id },
        data: { isActive: false },
      })

      await recordAuditLog({
        action: "SOFT_DELETE",
        entityType: "SCHOOL",
        entityId: id,
        description: `Deactivated school: ${school.name}`,
      })

      return school
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

/**
 * Add a user to a school with a specific role.
 */
export async function addUserToSchool(userId: string, schoolId: string, role: string) {
  return withDAL(
    "schools.addUser",
    async () => {
      const membership = await prisma.userSchool.create({
        data: {
          userId,
          schoolId,
          role: role as any,
        },
      })

      await recordAuditLog({
        action: "CREATE",
        entityType: "SCHOOL",
        entityId: schoolId,
        newValues: { userId, role },
        description: `Added user ${userId} to school with role ${role}`,
      })

      return membership
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}
