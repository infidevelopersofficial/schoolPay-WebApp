import { getFeeStructures } from "@/lib/dal/fee-structure"
import { CreateInvoiceForm } from "@/components/invoices/create-invoice-form"

export const metadata = { title: "New Invoice | SchoolPay" }

export default async function NewInvoicePage() {
  const feeStructures = await getFeeStructures()

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Create Invoice</h1>
        <p className="text-sm text-muted-foreground">Issue a new invoice to a student manually or from a fee structure.</p>
      </div>

      <CreateInvoiceForm feeStructures={feeStructures} />
    </div>
  )
}
