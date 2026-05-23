import { withTenantRead } from "@/lib/dal/core"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { recordAuditLog } from "@/lib/audit"
import { withDAL } from "@/lib/dal/utils"
import { getSchoolId } from "@/lib/tenant-context"
import { logger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"
import { auth } from "@/lib/auth"

const log = logger.child({ domain: "leads" })

// ──────────────────────────────────────────────
// Validation Schemas
// ──────────────────────────────────────────────

export const createLeadSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone is required"),
  source: z.string().min(1, "Source is required"),
  courseInterest: z.string().optional(),
  qualification: z.string().optional(),
  targetExam: z.string().optional(),
  budget: z.coerce.number().optional(),
  status: z.string().default("INQUIRY"),
  assignedToId: z.string().optional(),
  notes: z.string().optional(),
  nextFollowUpAt: z.string().optional(),
})

export type CreateLeadInput = z.infer<typeof createLeadSchema>

// ──────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────

export async function getLeads(opts?: { status?: string; assignedToId?: string; search?: string }) {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
  const { status, assignedToId, search } = opts ?? {}
  
  return withDAL(
    "leads.getAll",
    () =>
      prisma.lead.findMany({
        where: {
          schoolId,
          ...(status && { status }),
          ...(assignedToId && { assignedToId }),
          ...(search && {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
            ]
          })
        },
        orderBy: { createdAt: "desc" },
        include: {
          assignedTo: { select: { name: true, email: true } }
        }
      }),
    { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
  )
  })
}

export async function getLead(id: string) {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
  return withDAL(
    "leads.getOne",
    () =>
      prisma.lead.findUnique({
        where: { id },
        include: {
          assignedTo: { select: { name: true, email: true } }
        }
      }).then((lead) => {
        if (lead && lead.schoolId !== schoolId) return null
        return lead
      }),
    { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
  )
  })
}

// ──────────────────────────────────────────────
// Mutations
// ──────────────────────────────────────────────

export async function createLead(input: CreateLeadInput) {
  const schoolId = await getSchoolId()
  const session = await auth()
  const userId = session?.user?.id
  const userEmail = session?.user?.email
  const validated = createLeadSchema.parse(input)

  return withDAL(
    "leads.create",
    async () => {
      // Check for duplicate lead in this school
      const existing = await prisma.lead.findFirst({
        where: { schoolId, email: validated.email }
      });
      if (existing) {
        throw new Error("A lead with this email already exists");
      }

      const lead = await prisma.lead.create({
        data: {
          ...validated,
          schoolId,
          nextFollowUpAt: validated.nextFollowUpAt ? new Date(validated.nextFollowUpAt) : undefined,
        },
      })

      await recordAuditLog({
        action: "CREATE",
        entityType: "STUDENT", // Fallback to STUDENT as LEAD is not in EntityType enum
        entityId: lead.id,
        schoolId,
        userId,
        userEmail: userEmail ?? undefined,
        newValues: validated,
        description: `Created lead: ${lead.name}`,
      })

      return lead
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function updateLead(id: string, data: Partial<CreateLeadInput>) {
  const schoolId = await getSchoolId()
  const session = await auth()
  const userId = session?.user?.id
  
  return withDAL(
    "leads.update",
    async () => {
      const oldData = await prisma.lead.findUnique({ where: { id } })
      if (!oldData || oldData.schoolId !== schoolId) throw new Error("Lead not found")

      const lead = await prisma.lead.update({
        where: { id },
        data: {
          ...data,
          nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : undefined,
          lastContactedAt: data.status && data.status !== oldData.status ? new Date() : undefined
        },
      })

      await recordAuditLog({
        action: "UPDATE",
        entityType: "STUDENT", // Fallback to STUDENT as LEAD is not in EntityType enum
        entityId: id,
        schoolId,
        userId,
        oldValues: { status: oldData.status, notes: oldData.notes },
        newValues: { status: lead.status, notes: lead.notes },
        description: `Updated lead: ${lead.name}`,
      })

      return lead
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function convertLeadToStudent(id: string) {
  const schoolId = await getSchoolId()
  const session = await auth()
  const userId = session?.user?.id

  return withDAL(
    "leads.convert",
    async () => {
      return await prisma.$transaction(async (tx) => {
        const lead = await tx.lead.findUnique({ where: { id } })
        if (!lead || lead.schoolId !== schoolId) throw new Error("Lead not found")
        if (lead.convertedStudentId) throw new Error("Lead is already converted")

        // Create student from lead
        const student = await tx.student.create({
          data: {
            schoolId,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            class: lead.courseInterest || "Unassigned", // Map course interest to class
            section: "A",
            leadId: lead.id
          }
        })

        // Update lead
        const updatedLead = await tx.lead.update({
          where: { id },
          data: {
            status: "ENROLLED",
            convertedStudentId: student.id,
            convertedAt: new Date()
          }
        })

        await recordAuditLog({
          action: "UPDATE",
          entityType: "STUDENT", // Fallback to STUDENT as LEAD is not in EntityType enum
          entityId: id,
          schoolId,
          userId,
          newValues: { status: "ENROLLED", convertedStudentId: student.id },
          description: `Converted lead to student: ${student.name}`,
        }, tx)

        return student
      })
    },
    { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
  )
}
