"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createExpense, deleteExpense } from "./actions"
import { Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ExpensesClient({ expenses, categories }: any) {
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleCreate(formData: FormData) {
    startTransition(async () => {
      await createExpense(formData)
      setShowForm(false)
      router.refresh()
    })
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return
    startTransition(async () => {
      await deleteExpense(id)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)} className="bg-rose-600 hover:bg-rose-700">
          <Plus className="h-4 w-4 mr-2" /> Add Expense
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" placeholder="e.g. Salaries, Utilities, Maintenance" required />
              </div>
              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input id="amount" name="amount" type="number" step="0.01" min="0" required />
              </div>
              <div>
                <Label htmlFor="expenseDate">Date</Label>
                <Input id="expenseDate" name="expenseDate" type="date" required />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input id="description" name="description" placeholder="Brief description" />
              </div>
              <div className="md:col-span-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" disabled={isPending} className="bg-rose-600 hover:bg-rose-700">
                  {isPending ? "Saving..." : "Save Expense"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-8">No expenses recorded yet.</p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Description</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-500">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Created By</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp: any) => (
                    <tr key={exp.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="py-3 px-4">{new Date(exp.expenseDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4 capitalize">{exp.category}</td>
                      <td className="py-3 px-4 text-slate-500">{exp.description || "—"}</td>
                      <td className="py-3 px-4 text-right font-medium">₹{exp.amount.toLocaleString()}</td>
                      <td className="py-3 px-4">{exp.createdBy?.name || "—"}</td>
                      <td className="py-3 px-4 text-center">
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(exp.id)} disabled={isPending}>
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
