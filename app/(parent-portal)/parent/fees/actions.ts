"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getParentContext } from "@/lib/tenant-context"
import { razorpay } from "@/lib/billing/razorpay"

export async function createFeePaymentOrder(invoiceId: string) {
  try {
    const session = await auth()
    if (!session?.user) {
      return { error: "Unauthorized" }
    }

    const { schoolId, parentId } = await getParentContext()

    // Verify invoice belongs to this parent's child in this school
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        student: { select: { parentId: true, schoolId: true } }
      }
    })

    if (!invoice || invoice.student.parentId !== parentId || invoice.student.schoolId !== schoolId) {
      return { error: "Invoice not found or unauthorized" }
    }

    if (invoice.status === "PAID") {
      return { error: "Invoice is already paid" }
    }

    // Razorpay amount is in paise (₹1 = 100 paise)
    const amountInPaise = Math.round(invoice.total * 100)

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: invoice.invoiceNo,
      notes: { invoiceId: invoice.id,
        schoolId,
        studentId: invoice.studentId
      }
    })

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID || ""
    }
  } catch (error: any) {
    console.error("Payment Order Error:", error)
    return { error: error.message || "Failed to initiate payment" }
  }
}

export async function verifyFeePayment(
  razorpayOrderId: string, 
  razorpayPaymentId: string, 
  razorpaySignature: string, 
  invoiceId: string
) {
  try {
    const { schoolId, parentId } = await getParentContext()

    // 1. Verify signature
    const crypto = require("crypto")
    const secret = process.env.RAZORPAY_KEY_SECRET || "dummy_key_secret"
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(razorpayOrderId + "|" + razorpayPaymentId)
      .digest("hex")

    if (expectedSignature !== razorpaySignature) {
      return { error: "Invalid payment signature" }
    }

    // 2. Fetch Invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        student: { select: { parentId: true, schoolId: true } }
      }
    })

    if (!invoice || invoice.student.parentId !== parentId || invoice.student.schoolId !== schoolId) {
      return { error: "Invoice not found" }
    }

    // 3. Update Invoice and Create Payment Record transactionally
    await prisma.$transaction(async (tx) => {
      // Idempotency Check: if it's already paid, return early (handled outside if possible, but safe here)
      const currentInvoice = await tx.invoice.findUnique({
        where: { id: invoice.id },
        select: { status: true }
      })
      
      if (currentInvoice?.status === "PAID") {
        return
      }
      
      // Additional Idempotency Check: Prevent duplicate payment records for same razorpay transaction
      const existingPayment = await tx.payment.findFirst({
        where: { transactionId: razorpayPaymentId }
      })
      
      if (existingPayment) {
        // This transaction was already recorded (possibly by webhook), so just return
        return
      }

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: "PAID",
          paidAt: new Date()
        }
      })

      await tx.payment.create({
        data: {
          amount: invoice.total,
          date: new Date(),
          feeType: "Tuition Fee", // Simplify for now, ideally derived from invoice line items
          paymentMethod: "ONLINE",
          status: "COMPLETED",
          schoolId: invoice.student.schoolId,
          studentId: invoice.studentId,
          transactionId: razorpayPaymentId,
          metadata: { invoiceId: invoice.id, razorpayOrderId },
          receiptNumber: "RCPT-" + Math.random().toString(36).substring(2, 8).toUpperCase()
        }
      })

      // Update student pending/paid amounts
      await tx.student.update({
        where: { id: invoice.studentId },
        data: {
          paidAmount: { increment: invoice.total },
          pendingAmount: { decrement: invoice.total }
        }
      })

      // Audit Log
      await tx.auditLog.create({
        data: {
          action: "PAYMENT_VERIFIED",
          entityType: "INVOICE",
          entityId: invoice.id,
          schoolId: invoice.student.schoolId,
          newValues: { status: "PAID", razorpayPaymentId },
          description: "Payment verified from browser callback",
          userId: parentId
        }
      })
    })

    return { success: true }
  } catch (error: any) {
    console.error("Payment Verification Error:", error)
    return { error: error.message || "Failed to verify payment" }
  }
}
