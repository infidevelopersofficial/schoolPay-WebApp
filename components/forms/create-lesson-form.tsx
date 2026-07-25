"use client"

import { useActionState, useState } from "react"
import { createLessonAction } from "@/app/(dashboard)/dashboard/lessons/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { useFormEffect } from "@/lib/hooks/use-form-effect"

export function CreateLessonForm({ open, onOpenChange, onSuccess, classes = [], subjects = [], teachers = [] }: any) {
  const [state, formAction, isPending] = useActionState(createLessonAction, null)
  const [subjectVal, setSubjectVal] = useState("")
  const [classVal, setClassVal] = useState("")
  const [teacherId, setTeacherId] = useState("")

  useFormEffect(state, {
    successMessage: "Lesson scheduled successfully!",
    defaultErrorMessage: "Failed to schedule lesson",
    onOpenChange,
    onSuccess,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create Lesson Plan</DialogTitle></DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="subject" value={subjectVal} />
          <input type="hidden" name="class" value={classVal} />
          <input type="hidden" name="teacherId" value={teacherId} />

          <div className="space-y-2">
            <Label>Topic/Title <span className="text-red-500">*</span></Label>
            <Input name="title" placeholder="e.g. Quadratic Equations" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Subject <span className="text-red-500">*</span></Label>
              <Select value={subjectVal} onValueChange={setSubjectVal}>
                <SelectTrigger><SelectValue placeholder="Select subject..." /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s: any) => (
                    <SelectItem key={s.id} value={s.name}>{s.name} ({s.code})</SelectItem>
                  ))}
                  {subjects.length === 0 && <SelectItem value="General">General</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Class <span className="text-red-500">*</span></Label>
              <Select value={classVal} onValueChange={setClassVal}>
                <SelectTrigger><SelectValue placeholder="Select class..." /></SelectTrigger>
                <SelectContent>
                  {classes.map((c: any) => (
                    <SelectItem key={c.id} value={`${c.name}-${c.section}`}>
                      {c.name} - {c.section}
                    </SelectItem>
                  ))}
                  {classes.length === 0 && <SelectItem value="10-A">10 - A</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Assigned Teacher</Label>
            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger><SelectValue placeholder="Select teacher (optional)..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None / Unassigned</SelectItem>
                {teachers.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>{t.name} ({t.email})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date <span className="text-red-500">*</span></Label>
              <Input name="date" type="date" required />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input name="time" type="time" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Duration <span className="text-red-500">*</span></Label>
            <Input name="duration" placeholder="e.g. 45 mins" required />
          </div>
          <div className="space-y-2">
            <Label>Description/Objectives</Label>
            <Input name="description" placeholder="Lesson objectives and notes..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Scheduling..." : "Create Lesson"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
