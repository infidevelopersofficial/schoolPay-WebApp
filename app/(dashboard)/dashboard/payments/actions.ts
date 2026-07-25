"use server"

import { withTenantAuth } from "@/lib/tenant-auth"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { createPayment, createPaymentSchema } from "@/lib/dal/payments"
import { prisma } from "@/lib/prisma"
import { getSchoolId } from "@/lib/tenant-context"

export async function recordPaymentAction(prevState: any, formData: FormData) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      const session = await auth()
  if (!session) return { error: "Unauthorized" }

  const raw = Object.fromEntries(formData.entries())
  const result = createPaymentSchema.safeParse(raw)

  if (!result.success) {
    return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
  }

  try {
    await createPayment(result.data)
    revalidatePath("/dashboard/payments")
    revalidatePath("/dashboard/students")
    return { success: true }
  } catch (e) {
    return { error: "Failed to record payment" }
  }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}

export async function getFeeTypesAction() {
  try {
    return await withTenantAuth(null, ["ADMIN", "TEACHER"], async () => {
      const schoolId = await getSchoolId()
      // Fetch unique fee item names
      const feeItems = await prisma.feeItem.findMany({
        where: { feeStructure: { schoolId } },
        select: { name: true },
        distinct: ['name']
      })
      // Also fetch Fee types as fallback
      const fees = await prisma.fee.findMany({
        where: { schoolId },
        select: { type: true },
        distinct: ['type']
      })
      
      const allTypes = new Set([
        ...feeItems.map(f => f.name),
        ...fees.map(f => f.type),
        "Tuition Fee",
        "Transport Fee",
        "Library Fee",
        "Examination Fee"
      ])
      
      return { success: true, feeTypes: Array.from(allTypes) }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}

export async function getStudentPendingFeesAction(studentId: string) {
  try {
    return await withTenantAuth(null, ["ADMIN", "TEACHER", "ACCOUNTANT"], async () => {
      const schoolId = await getSchoolId()
      const [mappings, invoices] = await Promise.all([
        prisma.studentFeeMapping.findMany({
          where: { studentId, schoolId, status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } },
          include: { feeItem: true },
          orderBy: { dueDate: "asc" }
        }),
        prisma.invoice.findMany({
          where: { studentId, schoolId, status: { in: ["SENT", "OVERDUE", "DRAFT"] } },
          orderBy: { dueDate: "asc" }
        })
      ])

      const pendingList = [
        ...mappings.map(m => ({
          id: m.id,
          type: "MAPPING" as const,
          name: `${m.feeItem?.name || "Fee"} (Due: ${new Date(m.dueDate).toLocaleDateString()})`,
          feeType: m.feeItem?.name || "Tuition Fee",
          amount: Math.round(m.amount / 100), // convert paise to rupees for UI display
          status: m.status
        })),
        ...invoices.map(inv => ({
          id: inv.id,
          type: "INVOICE" as const,
          name: `Invoice #${inv.invoiceNo}${inv.title ? ` - ${inv.title}` : ""} (Due: ${new Date(inv.dueDate).toLocaleDateString()})`,
          feeType: inv.title || `Invoice #${inv.invoiceNo}`,
          amount: inv.total,
          status: inv.status
        }))
      ]

      return { success: true, pendingFees: pendingList }
    })
  } catch (e: any) {
    return { error: e.message || "Failed to fetch student fees" }
  }
}