import { withTenantRead } from "@/lib/dal/core"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { recordAuditLog } from "@/lib/audit"
import { withDAL } from "@/lib/dal/utils"
import { getSchoolId } from "@/lib/tenant-context"
import { logger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"
import { enforcePlanLimit } from "@/lib/billing/limits"

const log = logger.child({ domain: "students" })

// ──────────────────────────────────────────────
// Validation Schemas
// ──────────────────────────────────────────────

export const createStudentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  dateOfBirth: z.string().min(1, "Date of Birth is required"),
  class: z.string().min(1, "Class is required"),
  admissionNumber: z.string().optional().transform(v => v === "" ? undefined : v),
  parentName: z.string().min(1, "Parent Name is required"),
  parentEmail: z.string().email("Valid email required"),
  parentMobile: z.string().regex(/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"),
  sessionId: z.string().optional().transform(v => v === "" ? undefined : v),
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
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
  const { page = 1, limit = 50, search, classFilter, feeStatus, sortBy, sortDir } = opts ?? {}

  const where = {
    schoolId,
    isActive: true,
    ...(search && { name: { contains: search, mode: "insensitive" as const } }),
    ...(classFilter && { class: classFilter }),
    ...(feeStatus && { feeStatus: feeStatus as any }),
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
          include: { 
            parent: { select: { name: true, mobile: true } },
            session: { select: { name: true } }
          },
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
  })
}

export async function getStudent(id: string) {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
    return withDAL(
      "students.getOne",
      () =>
        prisma.student.findUnique({
          where: { id },
          include: {
            parent: true,
            payments: { orderBy: { date: "desc" }, take: 10 },
            attendance: { orderBy: { date: "desc" }, take: 30 },
            results: { orderBy: { createdAt: "desc" }, include: { exam: { select: { name: true, maxMarks: true } } } },
          },
        }).then((student) => {
          // Enforce ownership
          if (student && student.schoolId !== schoolId) return null
          return student
        }),
      { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
    )
  })
}

// ──────────────────────────────────────────────
// Mutations
// ──────────────────────────────────────────────

export async function createStudent(input: CreateStudentInput) {
  const schoolId = await getSchoolId()
  const validated = createStudentSchema.parse(input)

  // Enforce usage limit before creating
  await enforcePlanLimit({ schoolId, limitType: "studentLimit", incrementBy: 1 })

  return withDAL(
    "students.create",
    async () => {
      // Run as sequential transaction so we get the UsageRecord sync correctly
      const student = await prisma.$transaction(async (tx) => {
        // 1. Create or Find Parent User
        let parentUser = await tx.user.findUnique({ where: { email: validated.parentEmail } })
        if (!parentUser) {
          parentUser = await tx.user.create({
            data: {
              name: validated.parentName,
              email: validated.parentEmail,
            }
          })
        }

        // 2. Link Parent User to School with PARENT role
        await tx.userSchool.upsert({
          where: { userId_schoolId: { userId: parentUser.id, schoolId } },
          create: { userId: parentUser.id, schoolId, role: "PARENT" },
          update: {}
        })

        // 3. Create or Find Parent Record
        let parentRecord = await tx.parent.findUnique({
          where: { email_schoolId: { email: validated.parentEmail, schoolId } }
        })
        if (parentRecord) {
          throw new Error("A parent account with this email already exists.")
        }
        if (!parentRecord) {
          parentRecord = await tx.parent.create({
            data: {
              name: validated.parentName,
              email: validated.parentEmail,
              mobile: validated.parentMobile,
              userId: parentUser.id,
              schoolId
            }
          })
        }

        // 4. Generate Student ID
        const lastStudent = await tx.student.findFirst({
          where: { schoolId, studentId: { not: null } },
          orderBy: { createdAt: 'desc' }
        });
        const school = await tx.school.findUnique({ where: { id: schoolId } });
        
        let prefix = "STU";
        if (lastStudent && lastStudent.studentId) {
          const parts = lastStudent.studentId.split('-');
          if (parts.length >= 2) prefix = parts[0];
        } else if (school?.schoolCode) {
          prefix = school.schoolCode;
        } else if (school?.name) {
          prefix = school.name.substring(0, 3).toUpperCase();
        }

        const studentCount = await tx.student.count({ where: { schoolId } })
        const generatedStudentId = `${prefix}-STU-${String(studentCount + 1).padStart(3, '0')}`

        // 5. Create Student Record
        const created = await tx.student.create({
          data: {
            name: validated.name,
            class: validated.class,
            dateOfBirth: new Date(validated.dateOfBirth),
            admissionNumber: validated.admissionNumber,
            studentId: generatedStudentId,
            schoolId,
            parentId: parentRecord.id,
            feeStatus: "PENDING",
            paidAmount: 0,
            pendingAmount: validated.totalFees,
            admissionDate: new Date(),
            sessionId: validated.sessionId,
          },
        })

        // 6. Send Welcome Email (simulated/async in background)
        if (typeof window === 'undefined') {
          // Dynamic import to avoid edge runtime issues if this gets bundled
          const nodemailer = require("nodemailer");
          const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_SMTP_SERVER,
            port: parseInt(process.env.EMAIL_SMTP_PORT || "587"),
            auth: {
              user: process.env.EMAIL_SMTP_LOGIN,
              pass: process.env.EMAIL_SMTP_PASSWORD,
            },
          });
          
          transporter.sendMail({
            from: `"SchoolPay" <${process.env.EMAIL_SMTP_LOGIN}>`,
            to: validated.parentEmail,
            subject: "Welcome to SchoolPay! Your Login Instructions",
            html: `
              <h2>Welcome to SchoolPay</h2>
              <p>Dear ${validated.parentName},</p>
              <p>Your child <strong>${validated.name}</strong> has been enrolled successfully.</p>
              <p><strong>Student ID:</strong> ${generatedStudentId}</p>
              <br/>
              <p>You can now log in to the Parent Portal using your email address and OTP.</p>
            `
          }).catch((err: any) => console.error("Email failed:", err));
        }

        // Authoritative source of usage sync
        await tx.usageRecord.updateMany({
          where: { schoolId },
          data: { currentStudents: { increment: 1 } }
        })

        return created
      })

      await recordAuditLog({
        action: "CREATE",
        entityType: "STUDENT",
        entityId: student.id,
        schoolId,
        newValues: validated,
        description: `Registered student: ${student.name}`,
      })

      return student
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function updateStudent(id: string, data: Partial<CreateStudentInput>) {
  const schoolId = await getSchoolId()
  return withDAL(
    "students.update",
    async () => {
      const oldData = await prisma.student.findUnique({ where: { id } })
      if (oldData?.schoolId !== schoolId) throw new Error("Student not found")

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
        schoolId,
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
  const schoolId = await getSchoolId()
  return withDAL(
    "students.delete",
    async () => {
      const existing = await prisma.student.findUnique({ where: { id } })
      if (existing?.schoolId !== schoolId) throw new Error("Student not found")

      const student = await prisma.$transaction(async (tx) => {
        const updated = await tx.student.update({
          where: { id },
          data: { isActive: false },
        })

        // Authoritative source of usage sync
        await tx.usageRecord.updateMany({
          where: { schoolId },
          data: { currentStudents: { decrement: 1 } }
        })

        return updated
      })

      await recordAuditLog({
        action: "SOFT_DELETE",
        entityType: "STUDENT",
        entityId: id,
        schoolId,
        description: `Soft deleted student: ${student.name}`,
      })

      return student
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}
