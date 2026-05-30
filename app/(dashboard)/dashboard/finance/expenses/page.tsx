import { Metadata } from "next"
import { getExpenses } from "./actions"
import ExpensesClient from "./expenses-client"

export const metadata: Metadata = {
  title: "Expense Management | SchoolPay",
  description: "Track and manage institutional expenses.",
}

export default async function ExpensesPage() {
  const data = await getExpenses()

  return (
    <div className="space-y-8 p-6 md:p-10 max-w-7xl mx-auto">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 bg-clip-text text-transparent">
          Expense Management
        </h1>
        <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
          Record, categorize, and track institutional expenses.
        </p>
      </div>

      <ExpensesClient expenses={data.expenses} categories={data.categories} />
    </div>
  )
}
