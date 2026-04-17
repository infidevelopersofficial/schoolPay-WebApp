"use client"

import { useActionState } from "react"
import { addParentAction } from "@/app/(dashboard)/parents/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { useFormEffect } from "@/lib/hooks/use-form-effect"

export function AddParentForm({ open, onOpenChange, onSuccess }: any) {
  const [state, formAction, isPending] = useActionState(addParentAction, null)

  useFormEffect(state, {
    successMessage: "Parent added successfully!",
    defaultErrorMessage: "Failed to add parent",
    onOpenChange,
    onSuccess,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add Parent/Guardian</DialogTitle></DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name <span className="text-red-500">*</span></Label>
            <Input name="name" required />
          </div>
          <div className="space-y-2">
            <Label>Email <span className="text-red-500">*</span></Label>
            <Input name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label>Phone <span className="text-red-500">*</span></Label>
            <Input name="phone" required />
          </div>
          <div className="space-y-2">
            <Label>Relationship</Label>
            <Input name="relationship" placeholder="Father, Mother, etc." />
          </div>
          <div className="space-y-2">
            <Label>Occupation</Label>
            <Input name="occupation" />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input name="address" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Adding..." : "Add Parent"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
