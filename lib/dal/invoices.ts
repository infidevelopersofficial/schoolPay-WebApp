import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { recordAuditLog } from "@/lib/audit"
import { withDAL } from "@/lib/dal/utils"
import { getSchoolId } from "@/lib/tenant-context"
import { logger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"

const log = logger.child({ domain: "invoices" })

// ──────────────────────────────────────────────
// Types & Schemas
// ──────────────────────────────────────────────

const lineItemSchema = z.object({
  description: z.string().min(1),
  qty: z.coerce.number().positive().default(1),
  rate: z.coerce.number().positive(),
  amount: z.coerce.number().positive(),
})

export const createInvoiceSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item required"),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string().optional(),
})

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>

// ──────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────

export async function getInvoices(opts?: {
  page?: number
  limit?: number
  studentId?: string
  status?: string
}) {
  const schoolId = await getSchoolId()
  const { page = 1, limit = 50, studentId, status } = opts ?? {}
  const where: any = {
    schoolId,
    ...(studentId && { studentId }),
    ...(status && { status }),
  }

  return withDAL(
    "invoices.getAll",
    () =>
      Promise.all([
        prisma.invoice.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: { student: { select: { name: true, class: true } } },
        }),
        prisma.invoice.count({ where }),
      ]).then(([invoices, total]) => ({
        invoices,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      })),
    { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
  )
}

export async function getInvoice(id: string) {
  const schoolId = await getSchoolId()
  return withDAL(
    "invoices.getOne",
    () =>
      prisma.invoice.findUnique({
        where: { id },
        include: { student: { select: { name: true, email: true, class: true } } },
      }).then((inv) => {
        if (inv && inv.schoolId !== schoolId) return null
        return inv
      }),
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

// ──────────────────────────────────────────────
// Mutations
// ──────────────────────────────────────────────

export async function createInvoice(input: CreateInvoiceInput) {
  const schoolId = await getSchoolId()
  const validated = createInvoiceSchema.parse(input)

  // Calculate totals
  const subtotal = validated.lineItems.reduce((sum, item) => sum + item.amount, 0)
  const taxAmount = subtotal * (validated.taxRate / 100)
  const total = subtotal + taxAmount

  return withDAL(
    "invoices.create",
    async () => {
      // Verify student belongs to this school
      const student = await prisma.student.findUnique({
        where: { id: validated.studentId },
        select: { schoolId: true },
      })
      if (student?.schoolId !== schoolId) throw new Error("Student not found")

      const invoiceNo = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNo,
          studentId: validated.studentId,
          schoolId,
          lineItems: validated.lineItems,
          subtotal,
          taxRate: validated.taxRate,
          taxAmount,
          total,
          dueDate: new Date(validated.dueDate),
          notes: validated.notes,
          status: "DRAFT",
        },
      })

      await recordAuditLog({
        action: "CREATE",
        entityType: "PAYMENT",
        entityId: invoice.id,
        schoolId,
        newValues: { invoiceNo, total, studentId: validated.studentId },
        description: `Created invoice ${invoiceNo} for ₹${total.toFixed(2)}`,
      })

      return invoice
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function updateInvoiceStatus(id: string, status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED") {
  const schoolId = await getSchoolId()
  return withDAL(
    "invoices.updateStatus",
    async () => {
      const existing = await prisma.invoice.findUnique({ where: { id } })
      if (existing?.schoolId !== schoolId) throw new Error("Invoice not found")

      const invoice = await prisma.invoice.update({
        where: { id },
        data: {
          status,
          paidAt: status === "PAID" ? new Date() : undefined,
        },
      })

      await recordAuditLog({
        action: "UPDATE",
        entityType: "PAYMENT",
        entityId: id,
        schoolId,
        oldValues: { status: existing.status },
        newValues: { status },
        description: `Invoice ${existing.invoiceNo} marked as ${status}`,
      })

      return invoice
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function getInvoiceSummary() {
  const schoolId = await getSchoolId()
  return withDAL(
    "invoices.summary",
    () =>
      Promise.all([
        prisma.invoice.aggregate({ where: { schoolId, status: "PAID" }, _sum: { total: true } }),
        prisma.invoice.aggregate({ where: { schoolId, status: "SENT" }, _sum: { total: true } }),
        prisma.invoice.aggregate({ where: { schoolId, status: "OVERDUE" }, _sum: { total: true } }),
        prisma.invoice.count({ where: { schoolId } }),
      ]).then(([paid, pending, overdue, total]) => ({
        totalCollected: paid._sum.total ?? 0,
        totalPending: pending._sum.total ?? 0,
        totalOverdue: overdue._sum.total ?? 0,
        invoiceCount: total,
      })),
    { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
  )
}
