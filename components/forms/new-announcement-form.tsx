"use client"

import { useActionState } from "react"
import { createAnnouncementAction } from "@/app/(dashboard)/announcements/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { useFormEffect } from "@/lib/hooks/use-form-effect"

export function NewAnnouncementForm({ open, onOpenChange, onSuccess }: any) {
  const [state, formAction, isPending] = useActionState(createAnnouncementAction, null)

  useFormEffect(state, {
    successMessage: "Announcement posted successfully!",
    defaultErrorMessage: "Failed to post announcement",
    onOpenChange,
    onSuccess,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New Announcement</DialogTitle></DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label>Title <span className="text-red-500">*</span></Label>
            <Input name="title" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category <span className="text-red-500">*</span></Label>
              <Select name="category" defaultValue="GENERAL">
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
              <Select name="priority" defaultValue="LOW">
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
            <Select name="targetAudience" defaultValue="ALL">
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
            <Textarea name="content" className="min-h-[150px]" required />
          </div>
          <div className="space-y-2">
            <Label>Expiry Date (Optional)</Label>
            <Input name="expiryDate" type="date" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Posting..." : "Post Announcement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
