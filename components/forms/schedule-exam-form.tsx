"use client"

import { useActionState, useEffect } from "react"
import { createExamAction } from "@/app/(dashboard)/exams/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function ScheduleExamForm({ open, onOpenChange, onSuccess }: any) {
  const [state, formAction, isPending] = useActionState(createExamAction, null)

  useEffect(() => {
    if (state?.success) {
      toast.success("Exam scheduled successfully!")
      onOpenChange(false)
      onSuccess?.()
    } else if (state?.error) {
      toast.error(typeof state.error === "string" ? state.error : "Failed to schedule exam")
    }
  }, [state, onOpenChange, onSuccess])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Schedule Exam</DialogTitle></DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label>Exam Name</Label>
            <Input name="name" placeholder="Mid-Term, Final, etc." required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input name="subject" required />
            </div>
            <div className="space-y-2">
              <Label>Class</Label>
              <Input name="class" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input name="date" type="date" required />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input name="time" type="time" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duration (mins)</Label>
              <Input name="duration" defaultValue="120" required />
            </div>
            <div className="space-y-2">
              <Label>Maximum Marks</Label>
              <Input name="maxMarks" type="number" defaultValue="100" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Venue</Label>
            <Input name="venue" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Scheduling..." : "Schedule Exam"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
