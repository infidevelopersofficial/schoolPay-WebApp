"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { getTenantContext, TenantError } from "@/lib/tenant-context"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getExpenseStats, getExpensesList, getMonthlyExpenseChartData } from "@/lib/dal/expenses"

const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"]

const ExpenseSchema = z.object({
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  amount: z.coerce.number().positive("Amount must be positive"),
  expenseDate: z.coerce.date(),
  vendorName: z.string().optional(),
  receiptUrl: z.string().optional(),
  isRecurring: z.coerce.boolean().default(false),
  recurrenceType: z.string().optional(),
})

export async function createExpense(formData: FormData) {
  const ctx = await getTenantContext()
  if (!ALLOWED_ROLES.includes(ctx.schoolRole || "")) {
    throw new TenantError("Access denied: Insufficient permissions.")
  }

  const parsed = ExpenseSchema.safeParse({
    category: formData.get("category"),
    description: formData.get("description"),
    amount: formData.get("amount"),
    expenseDate: formData.get("expenseDate"),
    vendorName: formData.get("vendorName"),
    receiptUrl: formData.get("receiptUrl"),
    isRecurring: formData.get("isRecurring"),
    recurrenceType: formData.get("recurrenceType"),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const session = await auth()
  const userId = (session?.user as any)?.id as string
  if (!userId) throw new TenantError("Not authenticated")

  // Amount is submitted as rupees, convert to paise
  const amountPaise = Math.round(parsed.data.amount * 100)

  await prisma.expense.create({
    data: {
      schoolId: ctx.schoolId,
      createdById: userId,
      category: parsed.data.category,
      description: parsed.data.description || null,
      amount: amountPaise,
      expenseDate: parsed.data.expenseDate,
      vendorName: parsed.data.vendorName || null,
      receiptUrl: parsed.data.receiptUrl || null,
      isRecurring: parsed.data.isRecurring,
      recurrenceType: parsed.data.isRecurring ? (parsed.data.recurrenceType || "MONTHLY") : null,
      lastGeneratedAt: parsed.data.isRecurring ? new Date() : null, // Set initial generation time
    },
  })

  revalidatePath("/dashboard/finance/expenses")
  return { success: true }
}

export async function deleteExpense(expenseId: string) {
  const ctx = await getTenantContext()
  if (!ALLOWED_ROLES.includes(ctx.schoolRole || "")) {
    throw new TenantError("Access denied: Insufficient permissions.")
  }

  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, schoolId: ctx.schoolId },
  })

  if (!expense) {
    return { success: false, error: "Expense not found." }
  }

  await prisma.expense.delete({ where: { id: expenseId } })

  revalidatePath("/dashboard/finance/expenses")
  return { success: true }
}

export async function getDashboardData() {
  const ctx = await getTenantContext()
  if (!ALLOWED_ROLES.includes(ctx.schoolRole || "")) {
    throw new TenantError("Access denied: Insufficient permissions.")
  }

  const currentYear = new Date().getFullYear()

  const [stats, list, chartData] = await Promise.all([
    getExpenseStats(ctx.schoolId),
    getExpensesList(ctx.schoolId),
    getMonthlyExpenseChartData(ctx.schoolId, currentYear)
  ])

  return {
    stats,
    expenses: list,
    chartData
  }
}
