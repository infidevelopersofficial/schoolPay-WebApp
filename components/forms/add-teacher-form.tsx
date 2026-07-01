"use client"

import { useActionState, useState } from "react"
import { addTeacherAction } from "@/app/(dashboard)/dashboard/teachers/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2, Check } from "lucide-react"
import { useFormEffect } from "@/lib/hooks/use-form-effect"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface AddTeacherFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  classes?: any[]
  subjects?: any[]
}

export function AddTeacherForm({ open, onOpenChange, onSuccess, classes = [], subjects = [] }: AddTeacherFormProps) {
  const [state, formAction, isPending] = useActionState(addTeacherAction, null)
  
  // Replace scalar subject/class state with arrays
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([])
  const [classAssignments, setClassAssignments] = useState<{classId: string, isClassTeacher: boolean}[]>([])
  
  const [gender, setGender] = useState("")

  const toggleSubject = (id: string) => {
    setSelectedSubjectIds(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const toggleClass = (id: string) => {
    setClassAssignments(prev => {
      const exists = prev.find(p => p.classId === id)
      if (exists) return prev.filter(p => p.classId !== id)
      return [...prev, { classId: id, isClassTeacher: false }]
    })
  }

  const toggleClassTeacher = (id: string) => {
    setClassAssignments(prev => prev.map(p => 
      p.classId === id ? { ...p, isClassTeacher: !p.isClassTeacher } : p
    ))
  }

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
          <input type="hidden" name="gender" value={gender} />
          {selectedSubjectIds.map(id => (
            <input key={id} type="hidden" name="subjectIds" value={id} />
          ))}
          <input type="hidden" name="classAssignmentsData" value={JSON.stringify(classAssignments)} />

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
            <div className="space-y-2 col-span-2">
              <Label>Subjects <span className="text-red-500">*</span></Label>
              <div className="flex flex-wrap gap-2 p-2 border rounded-md max-h-[120px] overflow-y-auto bg-background">
                {subjects.map(s => {
                  const isSelected = selectedSubjectIds.includes(s.id)
                  return (
                    <Badge 
                      key={s.id} 
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleSubject(s.id)}
                    >
                      {s.name}
                      {isSelected && <Check className="ml-1 h-3 w-3" />}
                    </Badge>
                  )
                })}
                {subjects.length === 0 && <span className="text-sm text-muted-foreground">No subjects found.</span>}
              </div>
              {(state as any)?.fieldErrors?.subjectIds && (
                <p className="text-xs text-red-500">{(state as any).fieldErrors.subjectIds[0]}</p>
              )}
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Assigned Classes <span className="text-red-500">*</span></Label>
              <div className="flex flex-wrap gap-2 p-2 border rounded-md max-h-[160px] overflow-y-auto bg-background">
                {classes.map(c => {
                  const assignment = classAssignments.find(a => a.classId === c.id)
                  const isSelected = !!assignment
                  
                  return (
                    <div key={c.id} className={`flex items-center gap-1 p-1 border rounded-md ${isSelected ? 'border-primary bg-primary/5' : 'border-border'}`}>
                      <Badge 
                        variant={isSelected ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleClass(c.id)}
                      >
                        {c.name}
                        {isSelected && <Check className="ml-1 h-3 w-3" />}
                      </Badge>
                      {isSelected && (
                        <div 
                          className={`text-xs px-2 py-0.5 rounded-full cursor-pointer ml-1 transition-colors ${assignment.isClassTeacher ? 'bg-amber-100 text-amber-800 font-medium' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                          onClick={() => toggleClassTeacher(c.id)}
                        >
                          {assignment.isClassTeacher ? 'Class Teacher' : 'Make Class Teacher'}
                        </div>
                      )}
                    </div>
                  )
                })}
                {classes.length === 0 && <span className="text-sm text-muted-foreground">No classes found.</span>}
              </div>
              {(state as any)?.fieldErrors?.classAssignments && (
                <p className="text-xs text-red-500">{(state as any).fieldErrors.classAssignments[0]}</p>
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
