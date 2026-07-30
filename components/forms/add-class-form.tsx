"use client"

import { useActionState, useState } from "react"
import { addClassAction, updateClassAction } from "@/app/(dashboard)/dashboard/classes/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { useFormEffect } from "@/lib/hooks/use-form-effect"

export function AddClassForm({ open, onOpenChange, onSuccess, teachers = [], mode = "create", initialData }: any) {
  const [state, formAction, isPending] = useActionState(mode === "edit" ? updateClassAction : addClassAction, null)
  const [classTeacherId, setClassTeacherId] = useState(initialData?.classTeacherId || "")

  useFormEffect(state, {
    successMessage: "Class added successfully!",
    defaultErrorMessage: "Failed to add class",
    onOpenChange,
    onSuccess,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add Class</DialogTitle></DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="classTeacherId" value={classTeacherId} />
          {mode === "edit" && <input type="hidden" name="id" value={initialData?.id} />}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Grade/Name <span className="text-red-500">*</span></Label>
              <Input name="name" defaultValue={initialData?.name} placeholder="e.g. 10" required />
            </div>
            <div className="space-y-2">
              <Label>Section <span className="text-red-500">*</span></Label>
              <Input name="section" defaultValue={initialData?.section} placeholder="e.g. A" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Class Teacher</Label>
            <Select value={classTeacherId} onValueChange={setClassTeacherId}>
              <SelectTrigger>
                <SelectValue placeholder="Select class teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Room Number</Label>
              <Input name="room" defaultValue={initialData?.room} />
            </div>
            <div className="space-y-2">
              <Label>Capacity</Label>
              <Input name="capacity" type="number" defaultValue={initialData?.capacity || "40"} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? (mode === "edit" ? "Updating..." : "Adding...") : (mode === "edit" ? "Update Class" : "Add Class")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
