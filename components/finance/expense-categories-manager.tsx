"use client"

import { useState, useActionState } from "react"
import { Plus, Trash2, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"
import { createExpenseCategoryAction, deleteExpenseCategoryAction } from "@/app/(dashboard)/dashboard/finance/expenses/categories/actions"
import { toast } from "sonner"

export function ExpenseCategoriesManager({ categories }: { categories: any[] }) {
  // Create Category Action State
  const [state, formAction, isPending] = useActionState(createExpenseCategoryAction, null)

  async function handleDelete(id: string) {
    try {
      const res = await deleteExpenseCategoryAction(id)
      if ("success" in res && res.success) {
        toast.success("Category deleted")
      } else if ("error" in res) {
        toast.error(res.error || "Failed to delete category")
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred")
    }
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-lg">Manage Expense Categories</CardTitle>
        <CardDescription>Add or remove categories for classifying your institutional expenses.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form action={formAction} className="flex gap-2">
          <Input
            name="name"
            placeholder="New Category Name (e.g. MARKETING)"
            className="max-w-sm bg-slate-950 border-slate-800 uppercase"
            required
            maxLength={50}
          />
          <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            Add
          </Button>
        </form>

        {state?.error && (
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {categories.length === 0 ? (
            <p className="text-sm text-slate-500 col-span-full">No active categories found.</p>
          ) : (
            categories.map(category => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950/50"
              >
                <span className="text-sm font-medium text-slate-200 uppercase">{category.name}</span>
                <ConfirmDeleteDialog
                  title="Delete Category?"
                  description="Expenses using it will still display it, but it won't be available for new expenses."
                  onConfirm={() => handleDelete(category.id)}
                  triggerVariant="ghost"
                  triggerClassName="h-6 w-6 text-slate-500 hover:text-red-400 p-0"
                  triggerText={<Trash2 className="h-3 w-3" />}
                />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
