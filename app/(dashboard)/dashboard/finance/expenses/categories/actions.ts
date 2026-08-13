"use server"

import { createExpenseCategory, deleteExpenseCategory } from "@/lib/dal/expense-categories"
import { withTenantAuth } from "@/lib/tenant-auth"
import { revalidatePath } from "next/cache"

export async function createExpenseCategoryAction(prevState: any, formData: FormData) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      const name = formData.get("name") as string
      if (!name || !name.trim()) return { error: "Category name is required" }

      await createExpenseCategory(name)
      
      revalidatePath("/dashboard/finance/expenses")
      return { success: true }
    })
  } catch (error: any) {
    return { error: error.message || "Failed to create category" }
  }
}

export async function deleteExpenseCategoryAction(id: string) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      await deleteExpenseCategory(id)
      
      revalidatePath("/dashboard/finance/expenses")
      return { success: true }
    })
  } catch (error: any) {
    return { error: error.message || "Failed to delete category" }
  }
}
