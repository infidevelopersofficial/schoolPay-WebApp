import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    // Only allow cron requests (if using Vercel, they send a specific header)
    // Uncomment this in production
    /*
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    */

    const now = new Date()

    // Find all recurring expenses
    const recurringExpenses = await prisma.expense.findMany({
      where: {
        isRecurring: true,
      }
    })

    let generatedCount = 0

    for (const expense of recurringExpenses) {
      if (!expense.lastGeneratedAt || !expense.recurrenceType) continue

      const lastGenerated = new Date(expense.lastGeneratedAt)
      let nextDueDate = new Date(lastGenerated)

      // Calculate next due date based on recurrence type
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

      // If the next due date is in the past or today, we need to generate a new expense
      if (nextDueDate <= now) {
        await prisma.$transaction(async (tx) => {
          // Create the new auto-generated expense
          await tx.expense.create({
            data: {
              schoolId: expense.schoolId,
              createdById: expense.createdById,
              category: expense.category,
              description: expense.description ? `[Auto-generated] ${expense.description}` : `[Auto-generated] Recurring Expense`,
              amount: expense.amount,
              expenseDate: nextDueDate,
              vendorName: expense.vendorName,
              receiptUrl: null, // Don't duplicate receipt URLs
              isRecurring: false, // The newly generated instance itself is not the recurring template
            }
          })

          // Update the original template's lastGeneratedAt
          await tx.expense.update({
            where: { id: expense.id },
            data: { lastGeneratedAt: nextDueDate }
          })
        })
        
        generatedCount++
      }
    }

    return NextResponse.json({ success: true, generated: generatedCount })
  } catch (error: any) {
    console.error("Cron Expense Generation Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
