"use server"

import { revalidatePath } from "next/cache"
import { withTenantAuth } from "@/lib/tenant-auth"
import { getFeeStructureById } from "@/lib/dal/fee-structure"
import { createInvoice } from "@/lib/dal/invoices"
import { createInvoiceSchema, type CreateInvoiceInput } from "@/lib/validations/invoices"

export async function getFeeStructureDetailsAction(id: string) {
  return withTenantAuth(null, ["ADMIN", "ACCOUNTANT"], async () => {
    const structure = await getFeeStructureById(id)
    if (!structure) throw new Error("Fee structure not found")
    return structure
  })
}

export async function addInvoiceAction(
  prevState: any,
  formData: FormData
) {
  return withTenantAuth(null, ["ADMIN", "ACCOUNTANT"], async () => {
    try {
      const data = Object.fromEntries(formData.entries())
      const lineItemsStr = formData.get("lineItemsData") as string
      
      let lineItems = []
      if (lineItemsStr) {
        try {
          lineItems = JSON.parse(lineItemsStr)
        } catch (e) {
          return { error: "Invalid line items format" }
        }
      }

      const payload = {
        ...data,
        lineItems,
      }

      const validated = createInvoiceSchema.safeParse(payload)

      if (!validated.success) {
        return {
          error: "Validation failed",
          fieldErrors: validated.error.flatten().fieldErrors,
        }
      }

      const invoice = await createInvoice(validated.data)

      revalidatePath("/dashboard/invoices")
      return { success: true, invoiceId: invoice.id }
    } catch (error: any) {
      return { error: error.message || "Failed to create invoice" }
    }
  })
}
