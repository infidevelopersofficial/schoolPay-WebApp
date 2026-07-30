"use client"

import { useActionState, useState, useEffect } from "react"
import { addParentAction, updateParentAction, createStudentInlineForParentAction } from "@/app/(dashboard)/dashboard/parents/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2, Check, Plus } from "lucide-react"
import { useFormEffect } from "@/lib/hooks/use-form-effect"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export function AddParentForm({ open, onOpenChange, onSuccess, students = [], classes = [], mode = "create", initialData }: any) {
  const [state, formAction, isPending] = useActionState(mode === "edit" ? updateParentAction : addParentAction, null)
  const [relationship, setRelationship] = useState(initialData?.relationship || "Father")
  
  const [availableStudents, setAvailableStudents] = useState<any[]>(students)
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(initialData?.studentIds || [])
  const [studentSearch, setStudentSearch] = useState("")

  useEffect(() => {
    setAvailableStudents(students)
  }, [students])

  // Inline student creation state
  const [showNewStudentInput, setShowNewStudentInput] = useState(false)
  const [newStudentName, setNewStudentName] = useState("")
  const [newStudentClass, setNewStudentClass] = useState("")
  const [newStudentAdm, setNewStudentAdm] = useState("")
  const [creatingStudent, setCreatingStudent] = useState(false)

  const toggleStudent = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  async function handleCreateInlineStudent() {
    if (!newStudentName.trim() || !newStudentClass.trim()) {
      toast.error("Please enter both student name and class")
      return
    }
    setCreatingStudent(true)
    const res = await createStudentInlineForParentAction(newStudentName, newStudentClass, newStudentAdm || undefined)
    setCreatingStudent(false)
    if (res && "studentItem" in res && res.studentItem) {
      toast.success("Student created and attached!")
      setAvailableStudents(prev => [res.studentItem!, ...prev])
      setSelectedStudentIds(prev => [...prev, res.studentItem!.id])
      setNewStudentName("")
      setNewStudentClass("")
      setNewStudentAdm("")
      setShowNewStudentInput(false)
    } else {
      toast.error((res && "error" in res ? res.error : null) || "Failed to create student")
    }
  }

  useFormEffect(state, {
    successMessage: "Parent added successfully!",
    defaultErrorMessage: "Failed to add parent",
    onOpenChange,
    onSuccess,
  })

  const filteredStudents = availableStudents.filter(s => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.admissionNumber && s.admissionNumber.toLowerCase().includes(studentSearch.toLowerCase())) ||
    (s.class && s.class.toLowerCase().includes(studentSearch.toLowerCase()))
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add Parent/Guardian</DialogTitle></DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="relationship" value={relationship} />
          {selectedStudentIds.map(id => (
            <input key={id} type="hidden" name="studentIds" value={id} />
          ))}

          {mode === "edit" && <input type="hidden" name="id" value={initialData?.id} />}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name <span className="text-red-500">*</span></Label>
              <Input name="name" defaultValue={initialData?.name} placeholder="Mr. John Doe" required />
            </div>
            <div className="space-y-2">
              <Label>Email <span className="text-red-500">*</span></Label>
              <Input name="email" type="email" defaultValue={initialData?.email} placeholder="john@example.com" required disabled={mode === "edit"} />
            </div>
            <div className="space-y-2">
              <Label>Phone <span className="text-red-500">*</span></Label>
              <Input name="phone" defaultValue={initialData?.mobile} placeholder="1234567890" required />
            </div>
            <div className="space-y-2">
              <Label>Relationship to Student <span className="text-red-500">*</span></Label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Father">Father</SelectItem>
                  <SelectItem value="Mother">Mother</SelectItem>
                  <SelectItem value="Guardian">Guardian</SelectItem>
                  <SelectItem value="Emergency Contact">Emergency Contact</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2 col-span-2">
            <div className="flex items-center justify-between">
              <Label>Associate Students / Children</Label>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs text-primary hover:text-primary/80" 
                onClick={() => setShowNewStudentInput(!showNewStudentInput)}
              >
                <Plus className="h-3 w-3 mr-1" />
                {showNewStudentInput ? "Cancel" : "Add New Student"}
              </Button>
            </div>

            {showNewStudentInput && (
              <div className="flex gap-2 p-2 bg-muted/40 border rounded-md items-center mb-2">
                <Input 
                  placeholder="Student Name" 
                  value={newStudentName} 
                  onChange={e => setNewStudentName(e.target.value)} 
                  className="h-8 text-xs flex-1" 
                />
                <Input 
                  placeholder="Class (e.g. 10-A)" 
                  value={newStudentClass} 
                  onChange={e => setNewStudentClass(e.target.value)} 
                  className="h-8 text-xs w-28" 
                />
                <Input 
                  placeholder="Adm No" 
                  value={newStudentAdm} 
                  onChange={e => setNewStudentAdm(e.target.value)} 
                  className="h-8 text-xs w-24" 
                />
                <Button 
                  type="button" 
                  size="sm" 
                  className="h-8 px-3 text-xs" 
                  onClick={handleCreateInlineStudent} 
                  disabled={creatingStudent}
                >
                  {creatingStudent ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
                </Button>
              </div>
            )}

            <Input 
              placeholder="Search students by name, class, or admission number..." 
              value={studentSearch} 
              onChange={e => setStudentSearch(e.target.value)} 
              className="h-8 text-xs mb-2" 
            />

            <div className="flex flex-wrap gap-2 p-2 border rounded-md max-h-[140px] overflow-y-auto bg-background">
              {filteredStudents.map(s => {
                const isSelected = selectedStudentIds.includes(s.id)
                return (
                  <Badge 
                    key={s.id} 
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer py-1 px-2.5 text-xs flex items-center gap-1"
                    onClick={() => toggleStudent(s.id)}
                  >
                    <span>{s.name}</span>
                    <span className="text-[10px] opacity-75">({s.class || 'No Class'}{s.admissionNumber ? ` #${s.admissionNumber}` : ''})</span>
                    {isSelected && <Check className="h-3 w-3 ml-0.5" />}
                  </Badge>
                )
              })}
              {filteredStudents.length === 0 && <span className="text-sm text-muted-foreground">No students found.</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Occupation</Label>
              <Input name="occupation" defaultValue={initialData?.occupation} placeholder="Engineer, Doctor, etc." />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input name="address" defaultValue={initialData?.address} placeholder="123 Main St" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? (mode === "edit" ? "Updating..." : "Adding...") : (mode === "edit" ? "Update Parent" : "Add Parent")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
