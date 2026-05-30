import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { recordAuditLog } from "@/lib/audit"
import { getSchoolId } from "@/lib/tenant-context"
import { paymentLogger } from "@/lib/logger"
import { measureAsync, THRESHOLDS } from "@/lib/observability/performance"
import { addBreadcrumb, capturePaymentError, setSentryPaymentCtx } from "@/lib/observability/sentry-helpers"
import { auth } from "@/lib/auth"
import { publishEvent } from "@/lib/events/emitter"


export const createPaymentSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  feeType: z.string().min(1, "Fee type is required"),
  paymentMethod: z.enum(["CASH", "CARD", "UPI", "BANK_TRANSFER", "CHEQUE", "ONLINE"]),
  transactionId: z.string().optional(),
  receiptNumber: z.string().optional(),
  date: z.string().optional(),
  remarks: z.string().optional(),
  sessionId: z.string().optional(),
})

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>

import { withTenantRead } from "@/lib/dal/core"

export async function getPayments(opts?: { page?: number; limit?: number; studentId?: string }) {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
    const { page = 1, limit = 50, studentId } = opts ?? {}
    const where = {
      schoolId,
      ...(studentId && { studentId }),
    }

    return measureAsync(
      "payments.getAll",
      () =>
        Promise.all([
          prisma.payment.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { date: "desc" },
            include: { student: { select: { name: true, class: true } } },
          }),
          prisma.payment.count({ where }),
        ]).then(([payments, total]) => ({
          payments,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        })),
      { sentryOp: "db.query", domain: "db", thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
    )
  })
}

export async function createPayment(input: CreatePaymentInput) {
  // Resolve both schoolId and session up-front — before the $transaction opens.
  // This avoids a second auth() call inside the transaction where React.cache()
  // does not deduplicate, preventing double JWT decode and a potential race
  // where session expiry between calls would log userId: null.
  const schoolId = await getSchoolId()
  const session = await auth()
  const userId = session?.user?.id
  const userEmail = session?.user?.email

  const validated = createPaymentSchema.parse(input)

  setSentryPaymentCtx({
    studentId: validated.studentId,
    amount: validated.amount,
    paymentMethod: validated.paymentMethod,
  })

  addBreadcrumb("payment", "Payment creation started", {
    studentId: validated.studentId,
    amount: validated.amount,
    method: validated.paymentMethod,
    feeType: validated.feeType,
  })

  return measureAsync(
    "payments.create",
    async () => {
      try {
        const payment = await prisma.$transaction(async (tx) => {
          // Verify the student belongs to this school
          const student = await tx.student.findUnique({ where: { id: validated.studentId } })
          if (!student || student.schoolId !== schoolId) {
            throw new Error("Student not found")
          }

          const recentPayment = await tx.payment.findFirst({
            where: {
              studentId: validated.studentId,
              feeType: validated.feeType,
              amount: validated.amount,
              createdAt: { gt: new Date(Date.now() - 30 * 1000) }
            }
          })
          if (recentPayment) {
            throw new Error("Already paid: Duplicate payment detected.")
          }

          const created = await tx.payment.create({
            data: {
              ...validated,
              schoolId,
              date: validated.date ? new Date(validated.date) : new Date(),
              receiptNumber:
                validated.receiptNumber ||
                `RCP_${crypto.randomUUID().split("-")[0].toUpperCase()}`,
              status: "COMPLETED",
              sessionId: validated.sessionId,
            },
          })

          // Update student's paid/pending amounts using atomic increment to prevent
          // "lost update" race conditions on concurrent requests.
          const newPending = student.totalFees - (student.paidAmount + validated.amount)

          await tx.student.update({
            where: { id: validated.studentId },
            data: {
              paidAmount: { increment: validated.amount },
              pendingAmount: Math.max(0, newPending),
              feeStatus:
                newPending <= 0
                  ? "PAID"
                  : newPending > student.totalFees * 0.5
                    ? "OVERDUE"
                    : "PARTIAL",
            },
          })

          // Pass explicit userId/userEmail to avoid a second auth() call inside tx
          await recordAuditLog(
            {
              action: "CREATE",
              entityType: "PAYMENT",
              entityId: created.id,
              schoolId,
              userId,
              userEmail: userEmail ?? undefined,
              newValues: { ...validated, receiptNumber: created.receiptNumber },
              description: `Payment recorded for Student: ${student.name}`,
            },
            tx,
          )

          return created
        })

        paymentLogger.info(
          {
            paymentId: payment.id,
            studentId: validated.studentId,
            amount: validated.amount,
            method: validated.paymentMethod,
            receiptNumber: payment.receiptNumber,
          },
          "Payment created successfully",
        )

        addBreadcrumb("payment", "Payment created successfully", {
          paymentId: payment.id,
          receiptNumber: payment.receiptNumber,
        })

        // Emit PAYMENT_RECEIVED event safely
        try {
          const studentObj = await prisma.student.findUnique({
            where: { id: validated.studentId },
            include: { parent: true }
          })
          
          let parentUserId = studentObj?.parent?.userId || studentObj?.userId || null;
          let parentEmail = studentObj?.parent?.email || studentObj?.email;

          if (!parentUserId && parentEmail) {
            const matchingUser = await prisma.user.findUnique({
              where: { email: parentEmail }
            });
            parentUserId = matchingUser?.id || null;
          }

          if (parentEmail) {
            await prisma.notification.create({
              data: {
                schoolId,
                studentId: validated.studentId,
                type: "PAYMENT_CONFIRM",
                sentTo: parentEmail,
                status: "SENT"
              }
            });
            paymentLogger.info(`[PAYMENT_CONFIRM] Sent to ${parentEmail}`);
          }

          if (parentUserId && studentObj) {
            await publishEvent({
              eventType: "PAYMENT_RECEIVED",
              entityType: "PAYMENT",
              entityId: payment.id,
              schoolId,
              payload: {
                userId: parentUserId,
                schoolId,
                studentName: studentObj.name,
                invoiceNo: payment.receiptNumber,
                amount: payment.amount,
                paymentDate: payment.date,
                paymentMethod: payment.paymentMethod
              }
            })
          }
        } catch (eventErr) {
          paymentLogger.error({ err: eventErr }, "Failed to publish PAYMENT_RECEIVED event (non-blocking)")
        }

        return payment
      } catch (err) {
        paymentLogger.error(
          { err, studentId: validated.studentId, amount: validated.amount },
          "Payment creation failed",
        )

        capturePaymentError(err, {
          studentId: validated.studentId,
          amount: validated.amount,
          paymentMethod: validated.paymentMethod,
          operation: "create",
        })

        throw err
      }
    },
    { sentryOp: "payment.create", domain: "payment", thresholdMs: THRESHOLDS.PAYMENT_TRANSACTION },
  )
}

/**
 * Safely refunds a payment by running a reverse ledger transaction.
 */
export async function refundPayment(paymentId: string) {
  const schoolId = await getSchoolId()
  const session = await auth()
  const userId = session?.user?.id
  const userEmail = session?.user?.email

  addBreadcrumb("payment", "Refund initiated", { paymentId })

  return measureAsync(
    "payments.refund",
    async () => {
      try {
        const updated = await prisma.$transaction(async (tx) => {
          const payment = await tx.payment.findUnique({ where: { id: paymentId } })
          if (!payment) throw new Error("Payment not found")
          if (payment.schoolId !== schoolId) throw new Error("Payment not found")
          if (payment.status === "REFUNDED") throw new Error("Payment is already refunded")

          setSentryPaymentCtx({
            paymentId: payment.id,
            studentId: payment.studentId,
            amount: payment.amount,
            paymentMethod: payment.paymentMethod,
          })

          const updatedPayment = await tx.payment.update({
            where: { id: paymentId },
            data: { status: "REFUNDED" },
          })

          const student = await tx.student.findUnique({ where: { id: payment.studentId } })
          if (student) {
            const newPending = student.pendingAmount + payment.amount

            await tx.student.update({
              where: { id: payment.studentId },
              data: {
                paidAmount: { decrement: payment.amount },
                pendingAmount: newPending,
                feeStatus:
                  newPending <= 0
                    ? "PAID"
                    : newPending > student.totalFees * 0.5
                      ? "OVERDUE"
                      : "PARTIAL",
              },
            })
          }

          await recordAuditLog(
            {
              action: "REFUND",
              entityType: "PAYMENT",
              entityId: payment.id,
              schoolId,
              userId,
              userEmail: userEmail ?? undefined,
              oldValues: { status: "COMPLETED", paidAmount: student?.paidAmount },
              newValues: {
                status: "REFUNDED",
                paidAmount: student ? student.paidAmount - payment.amount : 0,
              },
              description: `Refunded ${payment.amount} for receipt ${payment.receiptNumber}`,
            },
            tx,
          )

          return updatedPayment
        })

        paymentLogger.info({ paymentId, refundedPaymentId: updated.id }, "Payment refunded successfully")
        addBreadcrumb("payment", "Payment refunded successfully", { paymentId })

        return updated
      } catch (err) {
        paymentLogger.error({ err, paymentId }, "Payment refund failed")
        capturePaymentError(err, {
          paymentId,
          studentId: "unknown",
          amount: 0,
          paymentMethod: "unknown",
          operation: "refund",
        })
        throw err
      }
    },
    { sentryOp: "payment.refund", domain: "payment", thresholdMs: THRESHOLDS.PAYMENT_TRANSACTION },
  )
}
