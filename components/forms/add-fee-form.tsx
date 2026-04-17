"use client"

import { useActionState } from "react"
import { addFeeAction } from "@/app/(dashboard)/fees/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { useFormEffect } from "@/lib/hooks/use-form-effect"

interface AddFeeFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddFeeForm({ open, onOpenChange, onSuccess }: AddFeeFormProps) {
  const [state, formAction, isPending] = useActionState(addFeeAction, null)

  useFormEffect(state, {
    successMessage: "Fee type added successfully!",
    onOpenChange,
    onSuccess,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Fee Type</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label>Fee Type <span className="text-red-500">*</span></Label>
            <Input name="type" placeholder="Tuition, Lab, Sports, etc." required />
          </div>
          <div className="space-y-2">
            <Label>Amount <span className="text-red-500">*</span></Label>
            <Input name="amount" type="number" placeholder="5000" required />
          </div>
          <div className="space-y-2">
            <Label>Description <span className="text-red-500">*</span></Label>
            <Textarea name="description" placeholder="Brief description of the fee" required />
          </div>
          <div className="space-y-2">
            <Label>Frequency <span className="text-red-500">*</span></Label>
            <Select name="frequency">
              <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                <SelectItem value="YEARLY">Yearly</SelectItem>
                <SelectItem value="ONE_TIME">One-time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Input name="dueDate" type="date" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Adding..." : "Add Fee Type"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
