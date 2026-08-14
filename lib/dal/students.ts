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

function parseDateToISO(val: string): string | null {
  const trimmed = val.trim()
  const ddmmyyyyRegex = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/
  const match = trimmed.match(ddmmyyyyRegex)
  if (match) {
    const day = parseInt(match[1], 10)
    const month = parseInt(match[2], 10) - 1
    const year = parseInt(match[3], 10)
    const date = new Date(Date.UTC(year, month, day))
    if (date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day) {
      return date.toISOString().split("T")[0]
    }
  }
  const date = new Date(trimmed)
  if (!isNaN(date.getTime())) {
    return date.toISOString().split("T")[0]
  }
  return null
}

export const createStudentSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  dateOfBirth: z.string().trim().optional().transform(v => v === "" ? undefined : v).superRefine((val, ctx) => {
    if (!val) return // optional – skip validation when not provided
    const iso = parseDateToISO(val)
    if (!iso) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Date of Birth must be in YYYY-MM-DD or DD/MM/YYYY format.",
      })
      return
    }
    const date = new Date(iso)
    const now = new Date()
    if (date > now) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Date of Birth cannot be in the future.",
      })
      return
    }
    let age = now.getFullYear() - date.getUTCFullYear()
    const monthDiff = now.getMonth() - date.getUTCMonth()
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getUTCDate())) {
      age--
    }
    if (age < 3 || age > 25) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Student age must be realistic (between 3 and 25 years old).",
      })
      return
    }
  }).transform(val => {
    if (!val) return undefined
    const iso = parseDateToISO(val)
    return iso || undefined
  }),
  class: z.string().trim().min(1, "Class is required"),
  section: z.string().trim().optional(),
  admissionNumber: z.string().trim().optional().transform(v => v === "" ? undefined : v),
  parentName: z.string().trim().min(1, "Parent Name is required"),
  parentEmail: z.string().trim().email("Valid email required"),
  parentMobile: z.string()
    .min(1, "Parent Mobile is required")
    .transform(val => val.replace(/[\s\-\(\)\.]/g, ""))
    .refine(val => /^[0-9]{10}$/.test(val), {
      message: "Please enter a valid 10-digit mobile number",
    }),
  sessionId: z.string().trim().optional().transform(v => v === "" ? undefined : v),
  totalFees: z.coerce.number({ message: "Total Fees must be a valid number" })
    .min(0, "Total Fees must be a non-negative number (>= 0)")
    .default(0),
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
  sectionFilter?: string
  sessionFilter?: string
  feeStatus?: string
  sortBy?: string
  sortDir?: "asc" | "desc"
}) {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
    const { 
      page = 1, 
      limit = 50, 
      search, 
      classFilter, 
      sectionFilter,
      sessionFilter,
      feeStatus, 
      sortBy, 
      sortDir 
    } = opts ?? {}

    const where = {
      schoolId,
      isActive: true,
      ...(search && { name: { contains: search, mode: "insensitive" as const } }),
      ...(classFilter && { class: classFilter }),
      ...(sectionFilter && { section: sectionFilter }),
      ...(sessionFilter && { sessionId: sessionFilter }),
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

export async function searchStudents(query: string, limit: number = 20) {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
    const safeLimit = Math.min(Math.max(limit, 1), 50)
    
    return withDAL(
      "students.search",
      () =>
        prisma.student.findMany({
          where: {
            schoolId,
            isActive: true,
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { admissionNumber: { contains: query, mode: "insensitive" } },
            ],
          },
          take: safeLimit,
          select: {
            id: true,
            name: true,
            admissionNumber: true,
            class: true,
            section: true,
          },
          orderBy: { name: "asc" },
        }),
      { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
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
      const txResult = await prisma.$transaction(async (tx) => {
        // 1. Create or Find Parent User
        // Note: tx.user.findUnique uses a composite key rewritten by the RLS extension → use findFirst with flat fields
        let parentUser = await tx.user.findFirst({ where: { email: validated.parentEmail } })
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
        // Note: composite key findUnique is rewritten by RLS extension to findFirst with extra schoolId injected → use findFirst directly
        let parentRecord = await tx.parent.findFirst({
          where: { email: validated.parentEmail, schoolId }
        })
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

        // 5. Normalize Class & Section and ensure Class record exists
        let normalizedClass = validated.class.trim()
        let normalizedSection = validated.section?.trim()

        if (normalizedClass.includes("-")) {
          const parts = normalizedClass.split("-").map(p => p.trim())
          if (parts[0]) normalizedClass = parts[0]
          if (parts[1] && !normalizedSection) normalizedSection = parts[1]
        }
        if (!normalizedSection) normalizedSection = "A"

        const existingClass = await tx.class.findFirst({
          where: {
            schoolId,
            name: { equals: normalizedClass, mode: "insensitive" },
            section: { equals: normalizedSection, mode: "insensitive" }
          }
        })

        if (!existingClass) {
          await tx.class.create({
            data: {
              name: normalizedClass,
              section: normalizedSection,
              capacity: 40,
              schoolId,
            }
          })
        }

        // 6. Create Student Record
        const created = await tx.student.create({
          data: {
            name: validated.name,
            class: `${normalizedClass}-${normalizedSection}`,
            section: normalizedSection,
            dateOfBirth: validated.dateOfBirth ? new Date(validated.dateOfBirth) : null,
            admissionNumber: validated.admissionNumber,
            studentId: generatedStudentId,
            schoolId,
            parentId: parentRecord.id,
            feeStatus: "PENDING",
            totalFees: validated.totalFees,
            paidAmount: 0,
            pendingAmount: validated.totalFees,
            admissionDate: new Date(),
            sessionId: validated.sessionId,
          },
        })

        // Authoritative source of usage sync
        await tx.usageRecord.updateMany({
          where: { schoolId },
          data: { currentStudents: { increment: 1 } }
        })

        return { created, generatedStudentId }
      })

      const student = txResult.created

      await recordAuditLog({
        action: "CREATE",
        entityType: "STUDENT",
        entityId: student.id,
        schoolId,
        newValues: validated,
        description: `Registered student: ${student.name}`,
      })

      // 6. Post-Transaction Decoupled Welcome Email Dispatch (P1-01)
      // Execute SMTP network call without holding database row locks or transaction connection
      if (typeof window === 'undefined') {
        (async () => {
          try {
            const nodemailer = await import("nodemailer");
            const transporter = nodemailer.createTransport({
              host: process.env.EMAIL_SMTP_HOST,
              port: parseInt(process.env.EMAIL_SMTP_PORT || "587"),
              auth: {
                user: process.env.EMAIL_SMTP_USER,
                pass: process.env.EMAIL_SMTP_PASS,
              },
            });
            
            await transporter.sendMail({
              from: `"SchoolPay" <${process.env.EMAIL_SMTP_USER}>`,
              to: validated.parentEmail,
              subject: "Welcome to SchoolPay! Your Login Instructions",
              html: `
                <h2>Welcome to SchoolPay</h2>
                <p>Dear ${validated.parentName},</p>
                <p>Your child <strong>${validated.name}</strong> has been enrolled successfully.</p>
                <p><strong>Student ID:</strong> ${txResult.generatedStudentId}</p>
                <br/>
                <p>You can now log in to the Parent Portal using your email address and OTP.</p>
              `
            });
            log.info({ studentId: student.id, parentEmail: validated.parentEmail }, "[Outbox] Welcome email sent successfully");
          } catch (err: any) {
            // Log to outbox/error monitor without rolling back committed student enrollment
            log.error({ err, studentId: student.id, parentEmail: validated.parentEmail }, "[Outbox Non-Blocking Error] Failed to send welcome email");
          }
        })();
      }

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

      const { parentName, parentEmail, parentMobile, ...cleanData } = data as any;
      const updated = await prisma.student.update({
        where: { id },
        data: {
          ...cleanData,
          dateOfBirth: cleanData.dateOfBirth ? new Date(cleanData.dateOfBirth) : undefined,
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
