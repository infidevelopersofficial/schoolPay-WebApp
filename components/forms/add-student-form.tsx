"use client"

import { useActionState } from "react"
import { addStudentAction } from "@/app/(dashboard)/students/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { useFormEffect } from "@/lib/hooks/use-form-effect"

interface AddStudentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddStudentForm({ open, onOpenChange, onSuccess }: AddStudentFormProps) {
  const [state, formAction, isPending] = useActionState(addStudentAction, null)

  useFormEffect(state, {
    successMessage: "Student added successfully!",
    onOpenChange,
    onSuccess,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name <span className="text-red-500">*</span></Label>
              <Input name="name" placeholder="John Doe" required />
            </div>
            <div className="space-y-2">
              <Label>Email <span className="text-red-500">*</span></Label>
              <Input name="email" type="email" placeholder="john@school.com" required />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input name="phone" placeholder="+1234567890" />
            </div>
            <div className="space-y-2">
              <Label>Class <span className="text-red-500">*</span></Label>
              <Select name="class">
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {["9A", "9B", "10A", "10B", "11A", "11B", "12A", "12B"].map(c => (
                    <SelectItem key={c} value={c}>Grade {c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input name="dateOfBirth" type="date" />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select name="gender">
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Roll Number</Label>
              <Input name="rollNumber" placeholder="001" />
            </div>
            <div className="space-y-2">
              <Label>Blood Group</Label>
              <Input name="bloodGroup" placeholder="A+" />
            </div>
            <div className="space-y-2">
              <Label>Total Fees</Label>
              <Input name="totalFees" type="number" placeholder="5000" defaultValue="5000" />
            </div>
            <div className="space-y-2">
              <Label>Emergency Contact</Label>
              <Input name="emergencyContact" placeholder="+1234567890" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input name="address" placeholder="123 Main St, City, State" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Adding..." : "Add Student"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
