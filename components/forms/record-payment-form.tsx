"use client"

import { useActionState, useEffect } from "react"
import { recordPaymentAction } from "@/app/(dashboard)/payments/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface RecordPaymentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function RecordPaymentForm({ open, onOpenChange, onSuccess }: RecordPaymentFormProps) {
  const [state, formAction, isPending] = useActionState(recordPaymentAction, null)

  useEffect(() => {
    if (state?.success) {
      toast.success("Payment recorded successfully!")
      onOpenChange(false)
      onSuccess?.()
    } else if (state?.error && typeof state.error === "string") {
      toast.error(state.error)
    }
  }, [state, onOpenChange, onSuccess])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label>Student ID <span className="text-red-500">*</span></Label>
            <Input name="studentId" placeholder="Enter student ID" required />
          </div>
          <div className="space-y-2">
            <Label>Fee Type <span className="text-red-500">*</span></Label>
            <Input name="feeType" placeholder="Tuition Fee" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount <span className="text-red-500">*</span></Label>
              <Input name="amount" type="number" placeholder="5000" required />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Payment Method <span className="text-red-500">*</span></Label>
            <Select name="paymentMethod">
              <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="CHEQUE">Cheque</SelectItem>
                <SelectItem value="ONLINE">Online Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Transaction ID</Label>
              <Input name="transactionId" placeholder="TXN123456" />
            </div>
            <div className="space-y-2">
              <Label>Receipt Number</Label>
              <Input name="receiptNumber" placeholder="Auto-generated" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
