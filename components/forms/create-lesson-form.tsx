"use client"

import { useActionState } from "react"
import { createLessonAction } from "@/app/(dashboard)/lessons/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { useFormEffect } from "@/lib/hooks/use-form-effect"

export function CreateLessonForm({ open, onOpenChange, onSuccess }: any) {
  const [state, formAction, isPending] = useActionState(createLessonAction, null)

  useFormEffect(state, {
    successMessage: "Lesson scheduled successfully!",
    defaultErrorMessage: "Failed to schedule lesson",
    onOpenChange,
    onSuccess,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Create Lesson Plan</DialogTitle></DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label>Topic/Title <span className="text-red-500">*</span></Label>
            <Input name="title" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Subject <span className="text-red-500">*</span></Label>
              <Input name="subject" required />
            </div>
            <div className="space-y-2">
              <Label>Class <span className="text-red-500">*</span></Label>
              <Input name="class" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date <span className="text-red-500">*</span></Label>
              <Input name="date" type="date" required />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input name="time" type="time" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Duration <span className="text-red-500">*</span></Label>
            <Input name="duration" placeholder="e.g. 45 mins" required />
          </div>
          <div className="space-y-2">
            <Label>Description/Objectives</Label>
            <Input name="description" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Scheduling..." : "Create Lesson"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
