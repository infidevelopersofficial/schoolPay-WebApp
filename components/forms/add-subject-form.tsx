"use client"

import { useActionState } from "react"
import { addSubjectAction } from "@/app/(dashboard)/subjects/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { useFormEffect } from "@/lib/hooks/use-form-effect"

export function AddSubjectForm({ open, onOpenChange, onSuccess }: any) {
  const [state, formAction, isPending] = useActionState(addSubjectAction, null)

  useFormEffect(state, {
    successMessage: "Subject added successfully!",
    defaultErrorMessage: "Failed to add subject",
    onOpenChange,
    onSuccess,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add Subject</DialogTitle></DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label>Subject Name <span className="text-red-500">*</span></Label>
            <Input name="name" required />
          </div>
          <div className="space-y-2">
            <Label>Subject Code <span className="text-red-500">*</span></Label>
            <Input name="code" required />
          </div>
          <div className="space-y-2">
            <Label>Department/Teacher</Label>
            <Input name="teacher" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input name="description" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Adding..." : "Add Subject"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
