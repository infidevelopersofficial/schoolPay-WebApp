"use client"

import { useActionState, useState } from "react"
import { createAnnouncementAction, updateAnnouncementAction } from "@/app/(dashboard)/dashboard/announcements/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { useFormEffect } from "@/lib/hooks/use-form-effect"

export function NewAnnouncementForm({ open, onOpenChange, onSuccess, mode = "create", initialData }: any) {
  const [state, formAction, isPending] = useActionState(mode === "edit" ? updateAnnouncementAction : createAnnouncementAction, null)
  
  const [category, setCategory] = useState(initialData?.category || "GENERAL")
  const [priority, setPriority] = useState(initialData?.priority || "LOW")
  const [targetAudience, setTargetAudience] = useState(initialData?.targetAudience || "ALL")

  useFormEffect(state, {
    successMessage: mode === "edit" ? "Announcement updated successfully!" : "Announcement posted successfully!",
    defaultErrorMessage: mode === "edit" ? "Failed to update announcement" : "Failed to post announcement",
    onOpenChange,
    onSuccess,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{mode === "edit" ? "Edit Announcement" : "New Announcement"}</DialogTitle></DialogHeader>
        <form action={formAction} className="space-y-4">
          {/* Hidden inputs for native FormData extraction */}
          <input type="hidden" name="category" value={category} />
          <input type="hidden" name="priority" value={priority} />
          <input type="hidden" name="targetAudience" value={targetAudience} />
          {mode === "edit" && <input type="hidden" name="id" value={initialData?.id} />}
          
          <div className="space-y-2">
            <Label>Title <span className="text-red-500">*</span></Label>
            <Input name="title" defaultValue={initialData?.title} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category <span className="text-red-500">*</span></Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">General</SelectItem>
                  <SelectItem value="ACADEMIC">Academic</SelectItem>
                  <SelectItem value="EVENT">Event</SelectItem>
                  <SelectItem value="HOLIDAY">Holiday</SelectItem>
                  <SelectItem value="EXAM">Exam</SelectItem>
                  <SelectItem value="FEE">Fee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority <span className="text-red-500">*</span></Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent!</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Target Audience <span className="text-red-500">*</span></Label>
            <Select value={targetAudience} onValueChange={setTargetAudience}>
              <SelectTrigger><SelectValue placeholder="Select target" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Everyone</SelectItem>
                <SelectItem value="STUDENTS">Students Only</SelectItem>
                <SelectItem value="TEACHERS">Teachers Only</SelectItem>
                <SelectItem value="PARENTS">Parents Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Content <span className="text-red-500">*</span></Label>
            <Textarea name="content" className="min-h-[150px]" defaultValue={initialData?.content} required />
          </div>
          <div className="space-y-2">
            <Label>Expiry Date (Optional)</Label>
            <Input name="expiryDate" type="date" defaultValue={initialData?.expiryDate} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? (mode === "edit" ? "Updating..." : "Posting...") : (mode === "edit" ? "Update Announcement" : "Post Announcement")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
