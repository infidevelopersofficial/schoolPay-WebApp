export interface FeeHead {
  id?: string
  description: string
  amount: number
  isTaxable: boolean
  cgstRate?: number
  sgstRate?: number
  igstRate?: number
  cgstAmount?: number
  sgstAmount?: number
  igstAmount?: number
  totalAmount: number
}

// Extends the lineItems JSON structure in Prisma Schema
export type InvoiceLineItems = FeeHead[]
