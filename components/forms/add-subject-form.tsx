"use client"

import { useActionState, useState } from "react"
import { addSubjectAction, updateSubjectAction } from "@/app/(dashboard)/dashboard/subjects/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { useFormEffect } from "@/lib/hooks/use-form-effect"
import { AsyncCombobox } from "@/components/ui/async-combobox"
import { searchTeachersAction } from "@/app/(dashboard)/dashboard/teachers/actions"
import type { AsyncSearchOption } from "@/components/ui/async-combobox"

export function AddSubjectForm({ open, onOpenChange, onSuccess, teachers = [], mode = "create", initialData }: any) {
  const [state, formAction, isPending] = useActionState(mode === "edit" ? updateSubjectAction : addSubjectAction, null)
  const [teacherId, setTeacherId] = useState(initialData?.teacherId || "")

  const defaultOptions: AsyncSearchOption[] = teachers.map((t: any) => ({
    value: t.id,
    label: t.name,
    subLabel: t.email
  }))

  useFormEffect(state, {
    successMessage: "Subject added successfully!",
    defaultErrorMessage: "Failed to add subject",
    onOpenChange,
    onSuccess,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add Subject</DialogTitle></DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="teacherId" value={teacherId} />
          {mode === "edit" && <input type="hidden" name="id" value={initialData?.id} />}
          
          <div className="space-y-2">
            <Label>Subject Name <span className="text-red-500">*</span></Label>
            <Input name="name" defaultValue={initialData?.name} placeholder="e.g. Mathematics" required />
          </div>
          <div className="space-y-2">
            <Label>Subject Code <span className="text-red-500">*</span></Label>
            <Input name="code" defaultValue={initialData?.code} placeholder="e.g. MATH101" required />
          </div>
          <div className="space-y-2 flex flex-col">
            <Label>Assigned Teacher</Label>
            <AsyncCombobox
              value={teacherId}
              onValueChange={setTeacherId}
              searchAction={searchTeachersAction}
              placeholder="Search teacher..."
              defaultOptions={defaultOptions}
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input name="description" defaultValue={initialData?.description} placeholder="Optional syllabus or description" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? (mode === "edit" ? "Updating..." : "Adding...") : (mode === "edit" ? "Update Subject" : "Add Subject")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
