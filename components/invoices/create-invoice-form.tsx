"use client"

import { useActionState, useState, useEffect } from "react"
import { useForm, useFieldArray, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { createInvoiceSchema } from "@/lib/dal/invoices"
import { addInvoiceAction, getFeeStructureDetailsAction } from "@/app/(dashboard)/dashboard/invoices/actions"
import { searchStudentsAction } from "@/app/(dashboard)/dashboard/students/actions"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, Plus, ArrowRight, Loader2 } from "lucide-react"
import { AsyncCombobox } from "@/components/ui/async-combobox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { z } from "zod"
import { useFormEffect } from "@/lib/hooks/use-form-effect"

export function CreateInvoiceForm({ feeStructures }: { feeStructures: any[] }) {
  const router = useRouter()
  const [selectedStructureId, setSelectedStructureId] = useState<string>("")
  const [isFetchingStructure, setIsFetchingStructure] = useState(false)

  const [state, formAction, isPending] = useActionState(addInvoiceAction, null)

  useFormEffect(state, {
    successMessage: "Invoice created successfully!",
    onSuccess: () => {
      router.push("/dashboard/invoices")
    }
  })

  const { register, control, setValue, formState: { errors } } = useForm<z.input<typeof createInvoiceSchema>>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      studentId: "",
      lineItems: [{ description: "", qty: 1, rate: 0, amount: 0 }],
      cgstRate: 0,
      sgstRate: 0,
      igstRate: 0,
      dueDate: new Date().toISOString().split("T")[0],
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems"
  })

  // Watch for changes to calculate live totals
  const studentId = useWatch({ control, name: "studentId" })
  const lineItems = useWatch({ control, name: "lineItems" }) || []
  const cgstRate = useWatch({ control, name: "cgstRate" }) || 0
  const sgstRate = useWatch({ control, name: "sgstRate" }) || 0
  const igstRate = useWatch({ control, name: "igstRate" }) || 0

  // Calculate row amounts automatically
  useEffect(() => {
    lineItems.forEach((item, index) => {
      const qty = Number(item.qty) || 0
      const rate = Number(item.rate) || 0
      const amount = qty * rate
      if (item.amount !== amount) {
        setValue(`lineItems.${index}.amount`, amount)
      }
    })
  }, [lineItems, setValue])

  // Calculate grand totals (Preview only — server recalculates totals with Decimal precision in createInvoice())
  const subtotal = lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  const cgstAmount = (subtotal * Number(cgstRate)) / 100
  const sgstAmount = (subtotal * Number(sgstRate)) / 100
  const igstAmount = (subtotal * Number(igstRate)) / 100
  const total = subtotal + cgstAmount + sgstAmount + igstAmount

  async function handleFillFromStructure() {
    if (!selectedStructureId) return
    setIsFetchingStructure(true)
    try {
      const structure = await getFeeStructureDetailsAction(selectedStructureId)
      if (structure && structure.items) {
        // Clear empty default row if it's the only one and empty
        if (fields.length === 1 && !fields[0].description && !fields[0].rate) {
          remove(0)
        }
        
        structure.items.forEach((item: any) => {
          append({
            description: item.name,
            qty: 1,
            rate: item.amount,
            amount: item.amount,
          })
        })
        toast({ title: "Pre-filled from structure" })
      }
    } catch (err: any) {
      toast({ title: "Failed to fetch structure", description: err.message, variant: "destructive" })
    } finally {
      setIsFetchingStructure(false)
    }
  }

  return (
    <form action={formAction} className="space-y-6 pb-20">
      <input type="hidden" name="studentId" value={studentId || ""} />
      <input type="hidden" name="lineItemsData" value={JSON.stringify(lineItems)} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label>Student <span className="text-destructive">*</span></Label>
              <AsyncCombobox
                searchAction={searchStudentsAction}
                placeholder="Search students by name or roll number..."
                onValueChange={(val) => setValue("studentId", val)}
              />
              {errors.studentId && <p className="text-sm text-destructive">{errors.studentId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Due Date <span className="text-destructive">*</span></Label>
              <Input type="date" {...register("dueDate")} />
              {errors.dueDate && <p className="text-sm text-destructive">{errors.dueDate.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Input placeholder="E.g. Term 1 Fees" {...register("notes")} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-sm font-medium">Quick Fill</h3>
            <p className="text-xs text-muted-foreground">Select a fee structure to automatically populate line items.</p>
            <div className="flex gap-2">
              <Select value={selectedStructureId} onValueChange={setSelectedStructureId}>
                <SelectTrigger className="flex-1 bg-background">
                  <SelectValue placeholder="Select Fee Structure" />
                </SelectTrigger>
                <SelectContent>
                  {feeStructures.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="secondary" onClick={handleFillFromStructure} disabled={!selectedStructureId || isFetchingStructure}>
                {isFetchingStructure ? "Loading..." : "Fill"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Line Items</h3>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ description: "", qty: 1, rate: 0, amount: 0 })}>
              <Plus className="h-4 w-4 mr-2" /> Add Item
            </Button>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground px-2">
              <div className="col-span-6">Description</div>
              <div className="col-span-2">Qty</div>
              <div className="col-span-2">Rate (₹)</div>
              <div className="col-span-2 text-right">Amount</div>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-2 items-center bg-muted/20 p-2 rounded-md">
                <div className="col-span-6">
                  <Input placeholder="Item description" {...register(`lineItems.${index}.description` as const)} />
                  {errors.lineItems?.[index]?.description && <p className="text-[10px] text-destructive">{errors.lineItems[index]?.description?.message}</p>}
                </div>
                <div className="col-span-2">
                  <Input type="number" step="1" min="1" {...register(`lineItems.${index}.qty` as const)} />
                </div>
                <div className="col-span-2">
                  <Input type="number" step="0.01" min="0" {...register(`lineItems.${index}.rate` as const)} />
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <span className="font-medium text-sm w-full text-right truncate pl-2">
                    ₹{(Number(lineItems[index]?.amount) || 0).toFixed(2)}
                  </span>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {errors.lineItems && <p className="text-sm text-destructive">{errors.lineItems.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Tax Configuration</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>CGST (%)</Label>
                  <Input type="number" step="0.01" min="0" max="100" {...register("cgstRate")} />
                </div>
                <div className="space-y-2">
                  <Label>SGST (%)</Label>
                  <Input type="number" step="0.01" min="0" max="100" {...register("sgstRate")} />
                </div>
                <div className="space-y-2">
                  <Label>IGST (%)</Label>
                  <Input type="number" step="0.01" min="0" max="100" {...register("igstRate")} />
                </div>
              </div>
            </div>

            <div className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">CGST</span>
                <span className="font-medium">₹{cgstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">SGST</span>
                <span className="font-medium">₹{sgstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IGST</span>
                <span className="font-medium">₹{igstAmount.toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t border-border flex justify-between items-center">
                <span className="font-bold">Total</span>
                <span className="font-bold text-lg text-primary">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} className="w-full md:w-auto min-w-[200px]">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? "Creating..." : "Create Invoice"}
          {!isPending && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </div>
    </form>
  )
}
