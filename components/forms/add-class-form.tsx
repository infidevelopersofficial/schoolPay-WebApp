"use client"

import { useActionState } from "react"
import { addClassAction } from "@/app/(dashboard)/dashboard/classes/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { useFormEffect } from "@/lib/hooks/use-form-effect"

export function AddClassForm({ open, onOpenChange, onSuccess, teachers = [] }: any) {
  const [state, formAction, isPending] = useActionState(addClassAction, null)
  const [classTeacherId, setClassTeacherId] = useState("")

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
