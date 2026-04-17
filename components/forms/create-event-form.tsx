"use client"

import { useActionState } from "react"
import { createEventAction } from "@/app/(dashboard)/events/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { useFormEffect } from "@/lib/hooks/use-form-effect"

export function CreateEventForm({ open, onOpenChange, onSuccess }: any) {
  const [state, formAction, isPending] = useActionState(createEventAction, null)

  useFormEffect(state, {
    successMessage: "Event created successfully!",
    defaultErrorMessage: "Failed to create event",
    onOpenChange,
    onSuccess,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Create Event</DialogTitle></DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label>Event Name <span className="text-red-500">*</span></Label>
            <Input name="name" required />
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
            <Label>Type <span className="text-red-500">*</span></Label>
            <Select name="type" defaultValue="OTHER">
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MEETING">Meeting</SelectItem>
                <SelectItem value="SPORTS">Sports</SelectItem>
                <SelectItem value="ACADEMIC">Academic</SelectItem>
                <SelectItem value="CULTURAL">Cultural</SelectItem>
                <SelectItem value="HOLIDAY">Holiday</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Location <span className="text-red-500">*</span></Label>
            <Input name="location" required />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea name="description" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Creating..." : "Create Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
