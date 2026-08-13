import { z } from "zod"

export const lineItemSchema = z.object({
  description: z.string().min(1),
  qty: z.coerce.number().positive().default(1),
  rate: z.coerce.number().positive(),
  amount: z.coerce.number().positive(),
})

export const createInvoiceSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item required"),
  cgstRate: z.coerce.number().min(0).max(100).default(0),
  sgstRate: z.coerce.number().min(0).max(100).default(0),
  igstRate: z.coerce.number().min(0).max(100).default(0),
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string().optional(),
})

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
