import { prisma } from "@/lib/prisma"
import { withTenantRead } from "@/lib/dal/core"

export async function getExpenseStats(schoolIdParam?: string, startDate?: Date, endDate?: Date) {
  return await withTenantRead(async (schoolId) => {
    const whereCondition: any = { schoolId }
    const paymentWhereCondition: any = { schoolId, status: "COMPLETED" }

    if (startDate && endDate) {
      whereCondition.expenseDate = { gte: startDate, lte: endDate }
      paymentWhereCondition.date = { gte: startDate, lte: endDate }
    }

    const [expensesResult, paymentsResult, categoryGroups] = await Promise.all([
      prisma.expense.aggregate({
        where: whereCondition,
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: paymentWhereCondition,
        _sum: { amount: true }
      }),
      prisma.expense.groupBy({
        by: ['category'],
        where: whereCondition,
        _sum: { amount: true }
      })
    ])

    const totalExpenses = expensesResult._sum.amount || 0
    const totalIncome = paymentsResult._sum.amount || 0 // Assuming Payment.amount is in the same units (paise)
    const net = totalIncome - totalExpenses

    return {
      totalExpenses,
      totalIncome,
      net,
      categoryBreakdown: categoryGroups.map(g => ({
        category: g.category,
        amount: g._sum.amount || 0
      }))
    }
  })
}

export async function getExpensesList(schoolIdParam?: string, filters?: { category?: string, isRecurring?: boolean }) {
  return await withTenantRead(async (schoolId) => {
    const where: any = { schoolId }
    if (filters?.category) where.category = filters.category
    if (filters?.isRecurring !== undefined) where.isRecurring = filters.isRecurring

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { expenseDate: 'desc' },
      include: {
        createdBy: {
          select: { name: true }
        }
      }
    })

    return expenses
  })
}

export async function getMonthlyExpenseChartData(schoolIdParam?: string, year: number = new Date().getFullYear()) {
  return await withTenantRead(async (schoolId) => {
    const startOfYear = new Date(year, 0, 1)
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999)

    const expenses = await prisma.expense.findMany({
      where: {
        schoolId,
        expenseDate: { gte: startOfYear, lte: endOfYear }
      },
      select: { amount: true, expenseDate: true }
    })

    const payments = await prisma.payment.findMany({
      where: {
        schoolId,
        status: "COMPLETED",
        date: { gte: startOfYear, lte: endOfYear }
      },
      select: { amount: true, date: true }
    })

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(year, i, 1).toLocaleString('default', { month: 'short' }),
      income: 0,
      expense: 0
    }))

    expenses.forEach(e => {
      const m = e.expenseDate.getMonth()
      monthlyData[m].expense += e.amount
    })

    payments.forEach(p => {
      const m = p.date.getMonth()
      monthlyData[m].income += p.amount
    })

    return monthlyData
  })
}
