"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { getTenantContext, TenantError } from "@/lib/tenant-context"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"]

const ExpenseSchema = z.object({
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  amount: z.coerce.number().positive("Amount must be positive"),
  expenseDate: z.coerce.date(),
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
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const session = await auth()
  const userId = (session?.user as any)?.id as string
  if (!userId) throw new TenantError("Not authenticated")

  await prisma.expense.create({
    data: {
      schoolId: ctx.schoolId,
      createdById: userId,
      category: parsed.data.category,
      description: parsed.data.description || null,
      amount: parsed.data.amount,
      expenseDate: parsed.data.expenseDate,
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

  // Verify the expense belongs to this tenant
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

export async function getExpenses(filters?: { category?: string; from?: string; to?: string }) {
  const ctx = await getTenantContext()
  if (!ALLOWED_ROLES.includes(ctx.schoolRole || "")) {
    throw new TenantError("Access denied: Insufficient permissions.")
  }

  const where: any = { schoolId: ctx.schoolId }

  if (filters?.category) {
    where.category = filters.category
  }
  if (filters?.from || filters?.to) {
    where.expenseDate = {}
    if (filters.from) where.expenseDate.gte = new Date(filters.from)
    if (filters.to) where.expenseDate.lte = new Date(filters.to)
  }

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { expenseDate: "desc" },
    include: { createdBy: { select: { name: true } } },
    take: 200,
  })

  const categories = await prisma.expense.groupBy({
    by: ["category"],
    where: { schoolId: ctx.schoolId },
  })

  return {
    expenses,
    categories: categories.map((c: any) => c.category),
  }
}
