"use client"

import { useActionState, useEffect } from "react"
import { markAttendanceAction } from "@/app/(dashboard)/attendance/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function MarkAttendanceForm({ open, onOpenChange, onSuccess }: any) {
  const [state, formAction, isPending] = useActionState(markAttendanceAction, null)

  useEffect(() => {
    if (state?.success) {
      toast.success("Attendance marked successfully!")
      onOpenChange(false)
      onSuccess?.()
    } else if (state?.error) {
      toast.error(typeof state.error === "string" ? state.error : "Failed to mark attendance")
    }
  }, [state, onOpenChange, onSuccess])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Mark Attendance</DialogTitle></DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label>Student ID <span className="text-red-500">*</span></Label>
            <Input name="studentId" required />
          </div>
          <div className="space-y-2">
            <Label>Date <span className="text-red-500">*</span></Label>
            <Input name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
          </div>
          <div className="space-y-2">
            <Label>Status <span className="text-red-500">*</span></Label>
            <Select name="status" defaultValue="PRESENT">
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PRESENT">Present</SelectItem>
                <SelectItem value="ABSENT">Absent</SelectItem>
                <SelectItem value="LATE">Late</SelectItem>
                <SelectItem value="EXCUSED">Excused</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Remarks</Label>
            <Input name="remarks" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Marking..." : "Mark Attendance"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
