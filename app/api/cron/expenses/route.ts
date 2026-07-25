import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { verifyCronAuth } from "@/lib/utils/cron-auth"

const BATCH_SIZE = 500

export async function GET(req: Request) {
  try {
    // 1. Mandatory fail-closed CRON_SECRET authentication
    const authError = verifyCronAuth(req)
    if (authError) return authError

    const now = new Date()
    let generatedCount = 0
    let cursorId: string | undefined = undefined

    // 2. Find recurring expenses using cursor-based pagination
    // to maintain constant memory usage regardless of total database size.
    while (true) {
      const recurringExpenses: any[] = await prisma.expense.findMany({
        where: {
          isRecurring: true,
        },
        take: BATCH_SIZE,
        skip: cursorId ? 1 : 0,
        cursor: cursorId ? ({ id: cursorId } as any) : undefined,
        orderBy: { id: "asc" }
      })

      if (recurringExpenses.length === 0) break

      for (const expense of recurringExpenses) {
        if (!expense.lastGeneratedAt || !expense.recurrenceType) continue

        const lastGenerated = new Date(expense.lastGeneratedAt)
        let nextDueDate = new Date(lastGenerated)

        switch (expense.recurrenceType) {
          case "MONTHLY":
            nextDueDate.setMonth(nextDueDate.getMonth() + 1)
            break
          case "QUARTERLY":
            nextDueDate.setMonth(nextDueDate.getMonth() + 3)
            break
          case "ANNUAL":
            nextDueDate.setFullYear(nextDueDate.getFullYear() + 1)
            break
          default:
            continue
        }

        if (nextDueDate <= now) {
          await prisma.$transaction(async (tx) => {
            await tx.expense.create({
              data: {
                schoolId: expense.schoolId,
                createdById: expense.createdById,
                category: expense.category,
                description: expense.description ? `[Auto-generated] ${expense.description}` : `[Auto-generated] Recurring Expense`,
                amount: expense.amount,
                expenseDate: nextDueDate,
                vendorName: expense.vendorName,
                receiptUrl: null,
                isRecurring: false,
              }
            })

            await tx.expense.update({
              where: { id: expense.id },
              data: { lastGeneratedAt: nextDueDate }
            })
          })
          
          generatedCount++
        }
      }

      cursorId = recurringExpenses[recurringExpenses.length - 1].id
      if (recurringExpenses.length < BATCH_SIZE) break
    }

    return NextResponse.json({ success: true, generated: generatedCount })
  } catch (error: any) {
    console.error("Cron Expense Generation Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

