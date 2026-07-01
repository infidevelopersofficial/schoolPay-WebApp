import { withTenantRead } from "@/lib/dal/core"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { recordAuditLog } from "@/lib/audit"
import { withDAL } from "@/lib/dal/utils"
import { getSchoolId } from "@/lib/tenant-context"
import bcrypt from "bcryptjs"
import { logger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"
import { enforcePlanLimit } from "@/lib/billing/limits"

const log = logger.child({ domain: "teachers" })

export const createTeacherSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(1, "Phone is required"),
  subject: z.string().optional(),
  class: z.string().optional(),
  dateOfBirth: z.string().optional().transform(v => v === "" ? undefined : v),
  gender: z.string().optional().transform(v => v === "" ? undefined : v),
  address: z.string().optional().transform(v => v === "" ? undefined : v),
  qualification: z.string().optional().transform(v => v === "" ? undefined : v),
  experience: z.string().optional().transform(v => v === "" ? undefined : v),
  joiningDate: z.string().optional().transform(v => v === "" ? undefined : v),
  salary: z.coerce.number().optional(),
  subjectIds: z.array(z.string()).optional(),
  classAssignments: z.array(z.object({
    classId: z.string(),
    isClassTeacher: z.boolean().default(false)
  })).optional()
})

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>

export async function getTeachers(opts?: {
  page?: number
  limit?: number
  search?: string
  subject?: string
}) {
  return withTenantRead(async () => {
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
  })
}

export async function getTeacher(id: string) {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
    return withDAL(
      "teachers.getOne",
      () =>
        prisma.teacher.findUnique({
          where: { id },
          include: {
            batches: true,
          },
        }).then((teacher) => {
          if (teacher && teacher.schoolId !== schoolId) return null
          return teacher
        }),
      { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
    )
  })
}

export async function createTeacher(input: CreateTeacherInput) {
  const schoolId = await getSchoolId()
  const validated = createTeacherSchema.parse(input)

  // Enforce usage limit before creating
  await enforcePlanLimit({ schoolId, limitType: "staffLimit", incrementBy: 1 })

  return withDAL(
    "teachers.create",
    async () => {
      const teacher = await prisma.$transaction(async (tx) => {
        // Create user account for the teacher to log in
        const hashedPassword = await bcrypt.hash(validated.phone, 10) // default password is phone
        const user = await tx.user.create({
          data: {
            name: validated.name,
            email: validated.email,
            phone: validated.phone,
            hashedPassword,
            role: "TEACHER"
          }
        })

        const { subjectIds, classAssignments, ...teacherData } = validated
        
        const created = await tx.teacher.create({
          data: {
            ...teacherData,
            subject: teacherData.subject || "N/A", // fallback for legacy column
            class: teacherData.class || "N/A",     // fallback for legacy column
            schoolId,
            dateOfBirth: teacherData.dateOfBirth ? new Date(teacherData.dateOfBirth) : undefined,
            joiningDate: teacherData.joiningDate ? new Date(teacherData.joiningDate) : new Date(),
          },
        })

        await tx.userSchool.create({
          data: {
            userId: user.id,
            schoolId,
            role: "TEACHER",
            staffId: created.id
          }
        })

        // Authoritative source of usage sync
        await tx.usageRecord.updateMany({
          where: { schoolId },
          data: { currentStaff: { increment: 1 } }
        })

        // ──────────────────────────────────────────────
        // Apply relational assignments inside the same tx
        // ──────────────────────────────────────────────
        
        if (subjectIds && subjectIds.length > 0) {
          for (const subjectId of subjectIds) {
            await tx.teacherSubject.upsert({
              where: { teacherId_subjectId: { teacherId: created.id, subjectId } },
              create: { teacherId: created.id, subjectId, schoolId, isActive: true },
              update: { isActive: true, schoolId }
            })
          }
        }

        if (classAssignments && classAssignments.length > 0) {
          for (const assignment of classAssignments) {
            await tx.teacherClassAssignment.upsert({
              where: { teacherId_classId: { teacherId: created.id, classId: assignment.classId } },
              create: { teacherId: created.id, classId: assignment.classId, schoolId, isActive: true, isClassTeacher: assignment.isClassTeacher },
              update: { isActive: true, schoolId }
            })
            
            if (assignment.isClassTeacher) {
               // Unset any previous class teachers for this class
               await tx.teacherClassAssignment.updateMany({
                 where: { classId: assignment.classId, schoolId, teacherId: { not: created.id } },
                 data: { isClassTeacher: false }
               })
               // Ensure current is set correctly
               await tx.teacherClassAssignment.updateMany({
                 where: { teacherId: created.id, classId: assignment.classId, schoolId },
                 data: { isClassTeacher: true }
               })
               // Update the Class record to map the classTeacherId
               await tx.class.update({
                 where: { id: assignment.classId, schoolId },
                 data: { classTeacherId: created.id }
               })
            }
          }
        }

        return created
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

      const teacher = await prisma.$transaction(async (tx) => {
        const updated = await tx.teacher.update({
          where: { id },
          data: { isActive: false },
        })

        // Authoritative source of usage sync
        await tx.usageRecord.updateMany({
          where: { schoolId },
          data: { currentStaff: { decrement: 1 } }
        })

        return updated
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

// ──────────────────────────────────────────────
// Assignment Management
// ──────────────────────────────────────────────

export const subjectAssignmentSchema = z.array(z.string())
export const classAssignmentSchema = z.array(z.object({
  classId: z.string(),
  isClassTeacher: z.boolean().default(false)
}))

export async function assignTeacherSubjects(teacherId: string, subjectIds: string[]) {
  const schoolId = await getSchoolId()
  return withDAL("teachers.assignSubjects", async () => {
    return prisma.$transaction(async (tx) => {
      // Find current active assignments
      const existing = await tx.teacherSubject.findMany({
        where: { teacherId, schoolId, isActive: true }
      })
      const existingIds = existing.map(e => e.subjectId)

      // Deactivate removed subjects
      const toRemove = existingIds.filter(id => !subjectIds.includes(id))
      if (toRemove.length > 0) {
        await tx.teacherSubject.updateMany({
          where: { teacherId, schoolId, subjectId: { in: toRemove } },
          data: { isActive: false }
        })
      }

      // Upsert new/existing subjects
      for (const subjectId of subjectIds) {
        await tx.teacherSubject.upsert({
          where: { teacherId_subjectId: { teacherId, subjectId } },
          create: { teacherId, subjectId, schoolId, isActive: true },
          update: { isActive: true, schoolId }
        })
      }
    })
  }, { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY })
}

export async function assignTeacherClasses(teacherId: string, assignments: z.infer<typeof classAssignmentSchema>) {
  const schoolId = await getSchoolId()
  return withDAL("teachers.assignClasses", async () => {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.teacherClassAssignment.findMany({
        where: { teacherId, schoolId, isActive: true }
      })
      const existingIds = existing.map(e => e.classId)
      const newIds = assignments.map(a => a.classId)

      // Deactivate removed classes
      const toRemove = existingIds.filter(id => !newIds.includes(id))
      if (toRemove.length > 0) {
        await tx.teacherClassAssignment.updateMany({
          where: { teacherId, schoolId, classId: { in: toRemove } },
          data: { isActive: false, isClassTeacher: false }
        })
      }

      // Upsert new/existing classes
      for (const assignment of assignments) {
        await tx.teacherClassAssignment.upsert({
          where: { teacherId_classId: { teacherId, classId: assignment.classId } },
          create: { teacherId, classId: assignment.classId, schoolId, isActive: true, isClassTeacher: assignment.isClassTeacher },
          update: { isActive: true, schoolId } // Do not blindly set isClassTeacher here, we enforce it strictly below if needed
        })
        
        if (assignment.isClassTeacher) {
           await tx.teacherClassAssignment.updateMany({
             where: { classId: assignment.classId, schoolId, teacherId: { not: teacherId } },
             data: { isClassTeacher: false }
           })
           await tx.teacherClassAssignment.updateMany({
             where: { teacherId, classId: assignment.classId, schoolId },
             data: { isClassTeacher: true }
           })
           await tx.class.update({
             where: { id: assignment.classId, schoolId },
             data: { classTeacherId: teacherId }
           })
        } else {
           // Ensure it is explicitly unset if passed as false, just in case they were un-assigned
           await tx.teacherClassAssignment.updateMany({
             where: { teacherId, classId: assignment.classId, schoolId },
             data: { isClassTeacher: false }
           })
        }
      }
    })
  }, { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY })
}

export async function setClassTeacher(classId: string, teacherId: string | null) {
  const schoolId = await getSchoolId()
  return withDAL("teachers.setClassTeacher", async () => {
    return prisma.$transaction(async (tx) => {
      // 1. Unset old isClassTeacher flag
      await tx.teacherClassAssignment.updateMany({
        where: { classId, schoolId },
        data: { isClassTeacher: false }
      })

      // 2. Set new classTeacherId on Class
      await tx.class.update({
        where: { id: classId, schoolId },
        data: { classTeacherId: teacherId }
      })

      // 3. Ensure the new teacher has an active assignment and isClassTeacher = true
      if (teacherId) {
        await tx.teacherClassAssignment.upsert({
          where: { teacherId_classId: { teacherId, classId } },
          create: { teacherId, classId, schoolId, isActive: true, isClassTeacher: true },
          update: { isActive: true, isClassTeacher: true, schoolId }
        })
      }
    })
  }, { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY })
}

export async function getTeacherWithAssignments(id: string) {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
    return withDAL("teachers.getWithAssignments", async () => {
      const teacher = await prisma.teacher.findUnique({
        where: { id },
        include: {
          subjects: {
            where: { schoolId, isActive: true },
            include: { subject: true }
          },
          classAssignments: {
            where: { schoolId, isActive: true },
            include: { class: true }
          }
        }
      })
      if (teacher && teacher.schoolId !== schoolId) return null
      return teacher
    }, { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY })
  })
}
