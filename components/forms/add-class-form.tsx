"use client"

import { useActionState, useEffect } from "react"
import { addClassAction } from "@/app/(dashboard)/classes/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function AddClassForm({ open, onOpenChange, onSuccess }: any) {
  const [state, formAction, isPending] = useActionState(addClassAction, null)

  useEffect(() => {
    if (state?.success) {
      toast.success("Class added successfully!")
      onOpenChange(false)
      onSuccess?.()
    } else if (state?.error) {
      toast.error(typeof state.error === "string" ? state.error : "Failed to add class")
    }
  }, [state, onOpenChange, onSuccess])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add Class</DialogTitle></DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Grade/Name <span className="text-red-500">*</span></Label>
              <Input name="name" placeholder="e.g. 10" required />
            </div>
            <div className="space-y-2">
              <Label>Section <span className="text-red-500">*</span></Label>
              <Input name="section" placeholder="e.g. A" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Class Teacher</Label>
            <Input name="classTeacher" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Room Number</Label>
              <Input name="room" />
            </div>
            <div className="space-y-2">
              <Label>Capacity</Label>
              <Input name="capacity" type="number" defaultValue="40" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Adding..." : "Add Class"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
