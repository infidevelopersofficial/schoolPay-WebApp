"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getExpenseStats, getExpensesList, getMonthlyExpenseChartData } from "@/lib/dal/expenses"
import { withTenantAuth } from "@/lib/tenant-auth"

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
  try {
    return await withTenantAuth(null, ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"], async (config, schoolId) => {
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
      const userId = session?.user?.id as string
      if (!userId) throw new Error("Not authenticated")

      // Amount is submitted as rupees, convert to paise
      const amountPaise = Math.round(parsed.data.amount * 100)

      await prisma.expense.create({
        data: {
          schoolId: schoolId,
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
    })
  } catch (e: any) {
    return { success: false, error: e.message || "Failed to create expense" }
  }
}

export async function deleteExpense(expenseId: string) {
  try {
    return await withTenantAuth(null, ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"], async (config, schoolId) => {
      const expense = await prisma.expense.findFirst({
        where: { id: expenseId, schoolId: schoolId },
      })

      if (!expense) {
        return { success: false, error: "Expense not found." }
      }

      await prisma.expense.delete({ where: { id: expenseId } })

      revalidatePath("/dashboard/finance/expenses")
      return { success: true }
    })
  } catch (e: any) {
    return { success: false, error: e.message || "Failed to delete expense" }
  }
}

export async function getDashboardData() {
  try {
    return await withTenantAuth(null, ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"], async (config, schoolId) => {
      const currentYear = new Date().getFullYear()

      const [stats, list, chartData] = await Promise.all([
        getExpenseStats(schoolId),
        getExpensesList(schoolId),
        getMonthlyExpenseChartData(schoolId, currentYear)
      ])

      return {
        stats,
        expenses: list,
        chartData
      }
    })
  } catch (e: any) {
    throw new Error(e.message || "Failed to load dashboard data")
  }
}

export async function approveExpenseAction(id: string) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async (config, schoolId) => {
      const session = await auth()
      const userId = session?.user?.id as string
      if (!userId) throw new Error("Not authenticated")

      await prisma.expense.updateMany({
        where: { id, schoolId },
        data: {
          approvalStatus: "APPROVED",
          approvedById: userId,
          approvedAt: new Date()
        }
      })

      revalidatePath("/dashboard/finance/expenses")
      return { success: true }
    })
  } catch (e: any) {
    return { success: false, error: e.message || "Failed to approve expense" }
  }
}

export async function rejectExpenseAction(id: string) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async (config, schoolId) => {
      const session = await auth()
      const userId = session?.user?.id as string
      if (!userId) throw new Error("Not authenticated")

      await prisma.expense.updateMany({
        where: { id, schoolId },
        data: {
          approvalStatus: "REJECTED",
          approvedById: userId,
          approvedAt: new Date()
        }
      })

      revalidatePath("/dashboard/finance/expenses")
      return { success: true }
    })
  } catch (e: any) {
    return { success: false, error: e.message || "Failed to reject expense" }
  }
}

