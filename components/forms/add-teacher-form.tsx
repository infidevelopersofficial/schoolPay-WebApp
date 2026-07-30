"use client"

import { useActionState, useState, useEffect } from "react"
import { addTeacherAction, updateTeacherAction, createClassInlineForTeacherAction, createSubjectInlineForTeacherAction } from "@/app/(dashboard)/dashboard/teachers/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2, Check, Plus } from "lucide-react"
import { useFormEffect } from "@/lib/hooks/use-form-effect"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"

interface AddTeacherFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  classes?: any[]
  subjects?: any[]
  mode?: "create" | "edit"
  initialData?: any
}

export function AddTeacherForm({ open, onOpenChange, onSuccess, classes = [], subjects = [], mode = "create", initialData }: AddTeacherFormProps) {
  const [state, formAction, isPending] = useActionState(mode === "edit" ? updateTeacherAction : addTeacherAction, null)
  
  const [availableClasses, setAvailableClasses] = useState<any[]>(classes)
  const [availableSubjects, setAvailableSubjects] = useState<any[]>(subjects)

  useEffect(() => {
    setAvailableClasses(classes)
  }, [classes])

  useEffect(() => {
    setAvailableSubjects(subjects)
  }, [subjects])

  // Replace scalar subject/class state with arrays
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(initialData?.subjectIds || [])
  const [classAssignments, setClassAssignments] = useState<{classId: string, isClassTeacher: boolean}[]>(initialData?.classAssignments || [])
  
  const [gender, setGender] = useState(initialData?.gender || "")

  // Inline Class creation state
  const [showNewClassInput, setShowNewClassInput] = useState(false)
  const [newClassName, setNewClassName] = useState("")
  const [newClassSection, setNewClassSection] = useState("")
  const [creatingClass, setCreatingClass] = useState(false)

  // Inline Subject creation state
  const [showNewSubjectInput, setShowNewSubjectInput] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState("")
  const [newSubjectCode, setNewSubjectCode] = useState("")
  const [creatingSubject, setCreatingSubject] = useState(false)

  async function handleCreateInlineClass() {
    if (!newClassName.trim() || !newClassSection.trim()) {
      toast.error("Please enter both class name and section")
      return
    }
    setCreatingClass(true)
    const res = await createClassInlineForTeacherAction(newClassName, newClassSection)
    setCreatingClass(false)
    if (res && "classItem" in res && res.classItem) {
      toast.success("Class created and selected!")
      setAvailableClasses(prev => [...prev, res.classItem!])
      setClassAssignments(prev => [...prev, { classId: res.classItem!.id, isClassTeacher: false }])
      setNewClassName("")
      setNewClassSection("")
      setShowNewClassInput(false)
    } else {
      toast.error((res && "error" in res ? res.error : null) || "Failed to create class")
    }
  }

  async function handleCreateInlineSubject() {
    if (!newSubjectName.trim() || !newSubjectCode.trim()) {
      toast.error("Please enter both subject name and code")
      return
    }
    setCreatingSubject(true)
    const res = await createSubjectInlineForTeacherAction(newSubjectName, newSubjectCode)
    setCreatingSubject(false)
    if (res && "subjectItem" in res && res.subjectItem) {
      toast.success("Subject created and selected!")
      setAvailableSubjects(prev => [...prev, res.subjectItem!])
      setSelectedSubjectIds(prev => [...prev, res.subjectItem!.id])
      setNewSubjectName("")
      setNewSubjectCode("")
      setShowNewSubjectInput(false)
    } else {
      toast.error((res && "error" in res ? res.error : null) || "Failed to create subject")
    }
  }

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

          {mode === "edit" && <input type="hidden" name="id" value={initialData?.id} />}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name <span className="text-red-500">*</span></Label>
              <Input name="name" defaultValue={initialData?.name} placeholder="Dr. John Smith" required />
            </div>
            <div className="space-y-2">
              <Label>Email <span className="text-red-500">*</span></Label>
              <Input name="email" type="email" defaultValue={initialData?.email} placeholder="john@school.com" required disabled={mode === "edit"} />
            </div>
            <div className="space-y-2">
              <Label>Phone <span className="text-red-500">*</span></Label>
              <Input name="phone" defaultValue={initialData?.phone} placeholder="+1234567890" required />
            </div>
            <div className="space-y-2 col-span-2">
              <div className="flex items-center justify-between">
                <Label>Subjects <span className="text-red-500">*</span></Label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs text-primary hover:text-primary/80" 
                  onClick={() => setShowNewSubjectInput(!showNewSubjectInput)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {showNewSubjectInput ? "Cancel" : "Create New Subject"}
                </Button>
              </div>
              {showNewSubjectInput && (
                <div className="flex gap-2 p-2 bg-muted/40 border rounded-md items-center mb-2">
                  <Input 
                    placeholder="Subject Name (e.g. Physics)" 
                    value={newSubjectName} 
                    onChange={e => setNewSubjectName(e.target.value)} 
                    className="h-8 text-xs flex-1" 
                  />
                  <Input 
                    placeholder="Code (e.g. PHY)" 
                    value={newSubjectCode} 
                    onChange={e => setNewSubjectCode(e.target.value)} 
                    className="h-8 text-xs w-24" 
                  />
                  <Button 
                    type="button" 
                    size="sm" 
                    className="h-8 px-3 text-xs" 
                    onClick={handleCreateInlineSubject} 
                    disabled={creatingSubject}
                  >
                    {creatingSubject ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
                  </Button>
                </div>
              )}
              <div className="flex flex-wrap gap-2 p-2 border rounded-md max-h-[120px] overflow-y-auto bg-background">
                {availableSubjects.map(s => {
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
                {availableSubjects.length === 0 && <span className="text-sm text-muted-foreground">No subjects found. Click &quot;Create New Subject&quot; above to add one.</span>}
              </div>
              {(state as any)?.fieldErrors?.subjectIds && (
                <p className="text-xs text-red-500">{(state as any).fieldErrors.subjectIds[0]}</p>
              )}
            </div>

            <div className="space-y-2 col-span-2">
              <div className="flex items-center justify-between">
                <Label>Assigned Classes <span className="text-red-500">*</span></Label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs text-primary hover:text-primary/80" 
                  onClick={() => setShowNewClassInput(!showNewClassInput)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {showNewClassInput ? "Cancel" : "Create New Class"}
                </Button>
              </div>
              {showNewClassInput && (
                <div className="flex gap-2 p-2 bg-muted/40 border rounded-md items-center mb-2">
                  <Input 
                    placeholder="Class (e.g. 10)" 
                    value={newClassName} 
                    onChange={e => setNewClassName(e.target.value)} 
                    className="h-8 text-xs flex-1" 
                  />
                  <Input 
                    placeholder="Section (e.g. A)" 
                    value={newClassSection} 
                    onChange={e => setNewClassSection(e.target.value)} 
                    className="h-8 text-xs w-24" 
                  />
                  <Button 
                    type="button" 
                    size="sm" 
                    className="h-8 px-3 text-xs" 
                    onClick={handleCreateInlineClass} 
                    disabled={creatingClass}
                  >
                    {creatingClass ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
                  </Button>
                </div>
              )}
              <div className="flex flex-wrap gap-2 p-2 border rounded-md max-h-[160px] overflow-y-auto bg-background">
                {availableClasses.map(c => {
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
                {availableClasses.length === 0 && <span className="text-sm text-muted-foreground">No classes found. Click &quot;Create New Class&quot; above to add one.</span>}
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
              <Input name="dateOfBirth" type="date" defaultValue={initialData?.dateOfBirth?.split('T')[0]} />
            </div>
            <div className="space-y-2">
              <Label>Qualification</Label>
              <Input name="qualification" defaultValue={initialData?.qualification} placeholder="M.Sc, B.Ed" />
            </div>
            <div className="space-y-2">
              <Label>Experience (years)</Label>
              <Input name="experience" defaultValue={initialData?.experience} placeholder="5" />
            </div>
            <div className="space-y-2">
              <Label>Joining Date</Label>
              <Input name="joiningDate" type="date" defaultValue={initialData?.joiningDate?.split('T')[0]} />
            </div>
            <div className="space-y-2">
              <Label>Salary</Label>
              <Input name="salary" type="number" defaultValue={initialData?.salary} placeholder="50000" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input name="address" defaultValue={initialData?.address} placeholder="123 Main St, City, State" />
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
              {isPending ? (mode === "edit" ? "Updating..." : "Adding...") : (mode === "edit" ? "Update Teacher" : "Add Teacher")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
