"use client"

import { useActionState, useState } from "react"
import { addStudentAction, updateStudentAction } from "@/app/(dashboard)/dashboard/students/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { useFormEffect } from "@/lib/hooks/use-form-effect"

interface AddStudentFormProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
  mode?: "create" | "edit"
  initialData?: any
}

export function AddStudentForm({ open = true, onOpenChange, onSuccess, mode = "create", initialData }: AddStudentFormProps) {
  const [state, formAction, isPending] = useActionState(mode === "create" ? addStudentAction : updateStudentAction, null)
  
  // State for Selects to pair with hidden inputs
  const [selectedClass, setSelectedClass] = useState(initialData?.class || "")
  const [selectedGender, setSelectedGender] = useState(initialData?.gender || "")

  useFormEffect(state, {
    successMessage: mode === "create" ? "Student added successfully!" : "Student updated successfully!",
    onOpenChange,
    onSuccess,
  })

  // Format date correctly if present
  const defaultDateOfBirth = initialData?.dateOfBirth 
    ? new Date(initialData.dateOfBirth).toISOString().split("T")[0] 
    : undefined

  const FormContent = (
    <form action={formAction} className="space-y-4">
      {mode === "edit" && <input type="hidden" name="id" value={initialData?.id} />}
      <input type="hidden" name="class" value={selectedClass} />
      <input type="hidden" name="gender" value={selectedGender} />
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Full Name <span className="text-red-500">*</span></Label>
          <Input name="name" defaultValue={initialData?.name} placeholder="John Doe" required />
        </div>
        {mode === "create" ? (
          <>
            <div className="space-y-2">
              <Label>Parent Name <span className="text-red-500">*</span></Label>
              <Input name="parentName" placeholder="Parent Name" required />
            </div>
            <div className="space-y-2">
              <Label>Parent Email <span className="text-red-500">*</span></Label>
              <Input name="parentEmail" type="email" placeholder="john@school.com" required />
            </div>
            <div className="space-y-2">
              <Label>Parent Mobile <span className="text-red-500">*</span></Label>
              <Input name="parentMobile" placeholder="9876543210" required />
            </div>
          </>
        ) : (
          <div className="col-span-1 space-y-2 p-3 bg-muted/50 rounded-md border">
            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground">Parent / Guardian</Label>
              {initialData?.parentId && (
                <a href={`/dashboard/parents/${initialData.parentId}/edit`} className="text-xs text-primary hover:underline">
                  Edit Parent Details ↗
                </a>
              )}
            </div>
            <div className="text-sm font-medium">{initialData?.parentName || "N/A"}</div>
            <div className="text-xs text-muted-foreground">{initialData?.parentEmail || "No Email"} • {initialData?.parentMobile || "No Mobile"}</div>
          </div>
        )}
        <div className="space-y-2">
          <Label>Class <span className="text-red-500">*</span></Label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
            <SelectContent>
              {["9A", "9B", "10A", "10B", "11A", "11B", "12A", "12B"].map(c => (
                <SelectItem key={c} value={c}>Grade {c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Section</Label>
          <Input name="section" defaultValue={initialData?.section} placeholder="e.g. A" />
        </div>
        <div className="space-y-2">
          <Label>Date of Birth</Label>
          <Input name="dateOfBirth" type="date" defaultValue={defaultDateOfBirth} />
        </div>
        <div className="space-y-2">
          <Label>Gender</Label>
          <Select value={selectedGender} onValueChange={setSelectedGender}>
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
          <Input name="rollNumber" defaultValue={initialData?.rollNumber} placeholder="001" />
        </div>
        <div className="space-y-2">
          <Label>Blood Group</Label>
          <Input name="bloodGroup" defaultValue={initialData?.bloodGroup} placeholder="A+" />
        </div>
        <div className="space-y-2">
          <Label>Total Fees</Label>
          <Input name="totalFees" type="number" defaultValue={initialData?.totalFees ?? "5000"} placeholder="5000" />
        </div>
        <div className="space-y-2">
          <Label>Emergency Contact</Label>
          <Input name="emergencyContact" defaultValue={initialData?.emergencyContact} placeholder="+1234567890" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Address</Label>
        <Input name="address" defaultValue={initialData?.address} placeholder="123 Main St, City, State" />
      </div>
      <div className={mode === "edit" ? "pt-4" : "pt-0"}>
        <DialogFooter>
          {onOpenChange && (
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? (mode === "create" ? "Adding..." : "Updating...") : (mode === "create" ? "Add Student" : "Update Student")}
          </Button>
        </DialogFooter>
      </div>
    </form>
  )

  if (mode === "edit") {
    return FormContent
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
        </DialogHeader>
        {FormContent}
      </DialogContent>
    </Dialog>
  )
}

