import { withTenantRead } from "@/lib/dal/core"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { createInvoiceSchema, type CreateInvoiceInput } from "@/lib/validations/invoices"
import { recordAuditLog } from "@/lib/audit"
import { withDAL } from "@/lib/dal/utils"
import { getSchoolId } from "@/lib/tenant-context"
import { logger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"
import { publishEvent } from "@/lib/events/emitter"
import { generateCollisionProofId } from "@/lib/utils/id-generator"


const log = logger.child({ domain: "invoices" })


// ──────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────

export async function getInvoices(opts?: {
  page?: number
  limit?: number
  studentId?: string
  status?: string
  query?: string
}) {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
  const { page = 1, limit = 50, studentId, status, query } = opts ?? {}
  const where: any = {
    schoolId,
    ...(studentId && { studentId }),
    ...(status && { status }),
    ...(query && {
      OR: [
        { invoiceNo: { contains: query, mode: "insensitive" } },
        { student: { name: { contains: query, mode: "insensitive" } } }
      ]
    })
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
        invoices: invoices.map(inv => ({
          ...inv,
          subtotal: inv.subtotal.toNumber(),
          cgstAmount: inv.cgstAmount?.toNumber() ?? 0,
          sgstAmount: inv.sgstAmount?.toNumber() ?? 0,
          igstAmount: inv.igstAmount?.toNumber() ?? 0,
          total: inv.total.toNumber(),
          discountAmount: inv.discountAmount?.toNumber() ?? 0,
          status: (inv.status !== "PAID" && inv.status !== "CANCELLED" && new Date(inv.dueDate) < new Date()) ? "OVERDUE" as const : inv.status
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      })),
    { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
  )
  })
}

export async function getInvoice(id: string) {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
  return withDAL(
    "invoices.getOne",
    () =>
      prisma.invoice.findUnique({
        where: { id },
        include: { student: { select: { name: true, email: true, class: true } } },
      }).then((inv) => {
        if (inv && inv.schoolId !== schoolId) return null
        if (inv && inv.status !== "PAID" && inv.status !== "CANCELLED" && new Date(inv.dueDate) < new Date()) {
          inv.status = "OVERDUE";
        }
        if (!inv) return null;
        return {
          ...inv,
          subtotal: inv.subtotal.toNumber(),
          cgstAmount: inv.cgstAmount?.toNumber() ?? 0,
          sgstAmount: inv.sgstAmount?.toNumber() ?? 0,
          igstAmount: inv.igstAmount?.toNumber() ?? 0,
          total: inv.total.toNumber(),
          discountAmount: inv.discountAmount?.toNumber() ?? 0,
        }
      }),
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
  })
}

// ──────────────────────────────────────────────
// Mutations
// ──────────────────────────────────────────────

export async function createInvoice(input: CreateInvoiceInput) {
  const schoolId = await getSchoolId()
  const validated = createInvoiceSchema.parse(input)

  // Calculate totals safely with Decimal
  const subtotal = new Prisma.Decimal(validated.lineItems.reduce((sum, item) => sum + item.amount, 0))
  const cgstAmount = subtotal.mul(validated.cgstRate ?? 0).div(100)
  const sgstAmount = subtotal.mul(validated.sgstRate ?? 0).div(100)
  const igstAmount = subtotal.mul(validated.igstRate ?? 0).div(100)
  const totalTax = cgstAmount.plus(sgstAmount).plus(igstAmount)
  const total = subtotal.plus(totalTax)

  return withDAL(
    "invoices.create",
    async () => {
      // Verify student belongs to this school
      const student = await prisma.student.findUnique({
        where: { id: validated.studentId },
        select: { schoolId: true },
      })
      if (student?.schoolId !== schoolId) throw new Error("Student not found")

      const invoiceNo = generateCollisionProofId("INV")

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNo,
          studentId: validated.studentId,
          schoolId,
          lineItems: validated.lineItems,
          subtotal,
          cgstRate: validated.cgstRate ?? 0,
          cgstAmount,
          sgstRate: validated.sgstRate ?? 0,
          sgstAmount,
          igstRate: validated.igstRate ?? 0,
          igstAmount,
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
        newValues: { invoiceNo, total: total.toNumber(), studentId: validated.studentId },
        description: `Created invoice ${invoiceNo} for ₹${total.toNumber().toFixed(2)}`,
      })

      return {
        ...invoice,
        subtotal: invoice.subtotal.toNumber(),
        cgstAmount: invoice.cgstAmount?.toNumber() ?? 0,
        sgstAmount: invoice.sgstAmount?.toNumber() ?? 0,
        igstAmount: invoice.igstAmount?.toNumber() ?? 0,
        total: invoice.total.toNumber(),
        discountAmount: invoice.discountAmount?.toNumber() ?? 0,
      }
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

      // Emit FEE_DUE event safely if status is updated to SENT
      if (status === "SENT") {
        try {
          const student = await prisma.student.findUnique({
            where: { id: invoice.studentId },
            include: { parent: true },
          });

          let parentUserId = student?.parent?.userId || student?.userId || null;
          if (!parentUserId && student?.parent?.email) {
            const matchingUser = await prisma.user.findUnique({
              where: { email: student.parent.email },
            });
            parentUserId = matchingUser?.id || null;
          }

          if (parentUserId && student) {
            await publishEvent({
              eventType: "FEE_DUE",
              entityType: "INVOICE",
              entityId: invoice.id,
              schoolId,
              payload: {
                userId: parentUserId,
                schoolId,
                studentName: student.name,
                invoiceNo: invoice.invoiceNo,
                amount: invoice.total.toNumber(),
                dueDate: invoice.dueDate,
              },
            });
          }
        } catch (eventErr) {
          console.error("[Non-blocking Error] Failed to publish FEE_DUE event:", eventErr);
        }
      }

      return {
        ...invoice,
        subtotal: invoice.subtotal.toNumber(),
        cgstAmount: invoice.cgstAmount?.toNumber() ?? 0,
        sgstAmount: invoice.sgstAmount?.toNumber() ?? 0,
        igstAmount: invoice.igstAmount?.toNumber() ?? 0,
        total: invoice.total.toNumber(),
        discountAmount: invoice.discountAmount?.toNumber() ?? 0,
      }
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function getInvoiceSummary() {
  return withTenantRead(async () => {
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
        totalCollected: paid._sum.total?.toNumber() ?? 0,
        totalPending: pending._sum.total?.toNumber() ?? 0,
        totalOverdue: overdue._sum.total?.toNumber() ?? 0,
        invoiceCount: total,
      })),
    { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
  )
  })
}
