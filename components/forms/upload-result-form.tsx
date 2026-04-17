"use client"

import { useActionState } from "react"
import { uploadResultAction } from "@/app/(dashboard)/results/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { useFormEffect } from "@/lib/hooks/use-form-effect"

export function UploadResultForm({ open, onOpenChange, onSuccess }: any) {
  const [state, formAction, isPending] = useActionState(uploadResultAction, null)

  useFormEffect(state, {
    successMessage: "Result uploaded successfully!",
    defaultErrorMessage: "Failed to upload result",
    onOpenChange,
    onSuccess,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Upload Result</DialogTitle></DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label>Student ID <span className="text-red-500">*</span></Label>
            <Input name="studentId" required />
          </div>
          <div className="space-y-2">
            <Label>Exam Name <span className="text-red-500">*</span></Label>
            <Input name="examName" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Marks Obtained <span className="text-red-500">*</span></Label>
              <Input name="marks" type="number" required />
            </div>
            <div className="space-y-2">
              <Label>Max Marks <span className="text-red-500">*</span></Label>
              <Input name="maxMarks" type="number" defaultValue="100" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Grade/Status <span className="text-red-500">*</span></Label>
            <Input name="grade" placeholder="A, B, Pass, Fail" required />
          </div>
          <div className="space-y-2">
            <Label>Remarks</Label>
            <Input name="remarks" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Uploading..." : "Upload Result"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
