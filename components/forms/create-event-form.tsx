"use client"

import { useActionState, useState } from "react"
import { createEventAction, updateEventAction } from "@/app/(dashboard)/dashboard/events/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { useFormEffect } from "@/lib/hooks/use-form-effect"

export function CreateEventForm({ open, onOpenChange, onSuccess, mode = "create", initialData }: any) {
  const [state, formAction, isPending] = useActionState(mode === "edit" ? updateEventAction : createEventAction, null)
  
  const [type, setType] = useState(initialData?.type || "OTHER")
  const [status, setStatus] = useState(initialData?.status || "UPCOMING")

  useFormEffect(state, {
    successMessage: mode === "edit" ? "Event updated successfully!" : "Event created successfully!",
    defaultErrorMessage: mode === "edit" ? "Failed to update event" : "Failed to create event",
    onOpenChange,
    onSuccess,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{mode === "edit" ? "Edit Event" : "Create Event"}</DialogTitle></DialogHeader>
        <form action={formAction} className="space-y-4">
          {/* Hidden inputs for native FormData extraction */}
          <input type="hidden" name="type" value={type} />
          {mode === "edit" && <input type="hidden" name="id" value={initialData?.id} />}
          {mode === "edit" && <input type="hidden" name="status" value={status} />}
          
          <div className="space-y-2">
            <Label>Event Name <span className="text-red-500">*</span></Label>
            <Input name="name" defaultValue={initialData?.name} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date <span className="text-red-500">*</span></Label>
              <Input name="date" type="date" defaultValue={initialData?.date} required />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input name="time" type="time" defaultValue={initialData?.time} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Type <span className="text-red-500">*</span></Label>
            <Select value={type} onValueChange={setType}>
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
            <Input name="location" defaultValue={initialData?.location} required />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea name="description" defaultValue={initialData?.description} />
          </div>
          
          {mode === "edit" && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPCOMING">Upcoming</SelectItem>
                  <SelectItem value="ONGOING">Ongoing</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? (mode === "edit" ? "Updating..." : "Creating...") : (mode === "edit" ? "Update Event" : "Create Event")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
