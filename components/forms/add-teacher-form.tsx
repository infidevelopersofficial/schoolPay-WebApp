"use client"

import { useActionState, useState } from "react"
import { addTeacherAction } from "@/app/(dashboard)/dashboard/teachers/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { useFormEffect } from "@/lib/hooks/use-form-effect"

interface AddTeacherFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddTeacherForm({ open, onOpenChange, onSuccess }: AddTeacherFormProps) {
  const [state, formAction, isPending] = useActionState(addTeacherAction, null)
  const [subject, setSubject] = useState("")
  const [assignedClass, setAssignedClass] = useState("")
  const [gender, setGender] = useState("")

  useFormEffect(state, {
    successMessage: "Teacher added successfully!",
    onOpenChange,
    onSuccess,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Teacher</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {/* Hidden inputs so shadcn Select values are included in FormData for server actions */}
          <input type="hidden" name="subject" value={subject} />
          <input type="hidden" name="class" value={assignedClass} />
          <input type="hidden" name="gender" value={gender} />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name <span className="text-red-500">*</span></Label>
              <Input name="name" placeholder="Dr. John Smith" required />
            </div>
            <div className="space-y-2">
              <Label>Email <span className="text-red-500">*</span></Label>
              <Input name="email" type="email" placeholder="john@school.com" required />
            </div>
            <div className="space-y-2">
              <Label>Phone <span className="text-red-500">*</span></Label>
              <Input name="phone" placeholder="+1234567890" required />
            </div>
            <div className="space-y-2">
              <Label>Subject <span className="text-red-500">*</span></Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {["Mathematics", "English", "Science", "History", "Geography", "Physics", "Chemistry", "Biology", "Computer Science", "Physical Education"].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(state as any)?.fieldErrors?.subject && (
                <p className="text-xs text-red-500">{(state as any).fieldErrors.subject[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Assigned Class <span className="text-red-500">*</span></Label>
              <Select value={assignedClass} onValueChange={setAssignedClass}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {["9A", "9B", "10A", "10B", "11A", "11B", "12A", "12B"].map(c => (
                    <SelectItem key={c} value={c}>Grade {c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(state as any)?.fieldErrors?.class && (
                <p className="text-xs text-red-500">{(state as any).fieldErrors.class[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input name="dateOfBirth" type="date" />
            </div>
            <div className="space-y-2">
              <Label>Qualification</Label>
              <Input name="qualification" placeholder="M.Sc, B.Ed" />
            </div>
            <div className="space-y-2">
              <Label>Experience (years)</Label>
              <Input name="experience" placeholder="5" />
            </div>
            <div className="space-y-2">
              <Label>Joining Date</Label>
              <Input name="joiningDate" type="date" />
            </div>
            <div className="space-y-2">
              <Label>Salary</Label>
              <Input name="salary" type="number" placeholder="50000" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input name="address" placeholder="123 Main St, City, State" />
          </div>
          {(state as any)?.error && (
            <p className="text-sm text-red-500 font-medium">{(state as any).error}</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Adding..." : "Add Teacher"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
