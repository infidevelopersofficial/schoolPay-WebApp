"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { db } from "@/lib/db/database"
import { toast } from "sonner"

// Add Parent Form
export function AddParentForm({ open, onOpenChange, onSuccess }: any) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    studentName: "",
    relationship: "",
    occupation: "",
    address: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (!formData.name || !formData.email || !formData.phone || !formData.studentName) {
        toast.error("Please fill in all required fields")
        setLoading(false)
        return
      }
      db.addParent(formData)
      toast.success("Parent added successfully!")
      setFormData({ name: "", email: "", phone: "", studentName: "", relationship: "", occupation: "", address: "" })
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error) {
      toast.error("Failed to add parent")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add Parent/Guardian</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name <span className="text-red-500">*</span></Label>
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email <span className="text-red-500">*</span></Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Phone <span className="text-red-500">*</span></Label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Student Name <span className="text-red-500">*</span></Label>
              <Input value={formData.studentName} onChange={(e) => setFormData({ ...formData, studentName: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Relationship</Label>
              <Select value={formData.relationship} onValueChange={(value) => setFormData({ ...formData, relationship: value })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Father">Father</SelectItem>
                  <SelectItem value="Mother">Mother</SelectItem>
                  <SelectItem value="Guardian">Guardian</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Occupation</Label>
            <Input value={formData.occupation} onChange={(e) => setFormData({ ...formData, occupation: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Adding..." : "Add Parent"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Add Subject Form
export function AddSubjectForm({ open, onOpenChange, onSuccess }: any) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ name: "", code: "", teacher: "", classes: "1", students: "0", description: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (!formData.name || !formData.code) {
        toast.error("Please fill in all required fields")
        setLoading(false)
        return
      }
      db.addSubject({ ...formData, classes: parseInt(formData.classes), students: parseInt(formData.students) })
      toast.success("Subject added successfully!")
      setFormData({ name: "", code: "", teacher: "", classes: "1", students: "0", description: "" })
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error) {
      toast.error("Failed to add subject")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Subject</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Subject Name <span className="text-red-500">*</span></Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Subject Code <span className="text-red-500">*</span></Label>
              <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Teacher</Label>
            <Input value={formData.teacher} onChange={(e) => setFormData({ ...formData, teacher: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Adding..." : "Add Subject"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Add Class Form
export function AddClassForm({ open, onOpenChange, onSuccess }: any) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ name: "", section: "", strength: "30", classTeacher: "", room: "", capacity: "40" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (!formData.name || !formData.section) {
        toast.error("Please fill in all required fields")
        setLoading(false)
        return
      }
      db.addClass({ ...formData, strength: parseInt(formData.strength), capacity: parseInt(formData.capacity) })
      toast.success("Class added successfully!")
      setFormData({ name: "", section: "", strength: "30", classTeacher: "", room: "", capacity: "40" })
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error) {
      toast.error("Failed to add class")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Class</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Class Name <span className="text-red-500">*</span></Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Grade 10" required />
            </div>
            <div className="space-y-2">
              <Label>Section <span className="text-red-500">*</span></Label>
              <Input value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value })} placeholder="A" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Current Strength</Label>
              <Input type="number" value={formData.strength} onChange={(e) => setFormData({ ...formData, strength: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Capacity</Label>
              <Input type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Class Teacher</Label>
              <Input value={formData.classTeacher} onChange={(e) => setFormData({ ...formData, classTeacher: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Room Number</Label>
              <Input value={formData.room} onChange={(e) => setFormData({ ...formData, room: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Adding..." : "Add Class"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Create Lesson Form
export function CreateLessonForm({ open, onOpenChange, onSuccess }: any) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    class: "",
    teacher: "",
    date: "",
    time: "",
    duration: "45",
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (!formData.title || !formData.subject || !formData.class || !formData.date) {
        toast.error("Please fill in all required fields")
        setLoading(false)
        return
      }
      db.addLesson({ ...formData, duration: `${formData.duration} min`, status: "scheduled" })
      toast.success("Lesson created successfully!")
      setFormData({ title: "", subject: "", class: "", teacher: "", date: "", time: "", duration: "45", description: "" })
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error) {
      toast.error("Failed to create lesson")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Create Lesson</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Lesson Title <span className="text-red-500">*</span></Label>
            <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Subject <span className="text-red-500">*</span></Label>
              <Input value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Class <span className="text-red-500">*</span></Label>
              <Input value={formData.class} onChange={(e) => setFormData({ ...formData, class: e.target.value })} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Teacher</Label>
            <Input value={formData.teacher} onChange={(e) => setFormData({ ...formData, teacher: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Date <span className="text-red-500">*</span></Label>
              <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Duration (min)</Label>
              <Input type="number" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Lesson"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Schedule Exam Form
export function ScheduleExamForm({ open, onOpenChange, onSuccess }: any) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    class: "",
    date: "",
    time: "",
    duration: "120",
    maxMarks: "100",
    venue: "",
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (!formData.name || !formData.subject || !formData.class || !formData.date) {
        toast.error("Please fill in all required fields")
        setLoading(false)
        return
      }
      db.addExam({
        ...formData,
        duration: `${parseInt(formData.duration) / 60} hours`,
        maxMarks: parseInt(formData.maxMarks),
        status: "scheduled",
      })
      toast.success("Exam scheduled successfully!")
      setFormData({ name: "", subject: "", class: "", date: "", time: "", duration: "120", maxMarks: "100", venue: "", description: "" })
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error) {
      toast.error("Failed to schedule exam")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Schedule Exam</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Exam Name <span className="text-red-500">*</span></Label>
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Midterm Exam" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Subject <span className="text-red-500">*</span></Label>
              <Input value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Class <span className="text-red-500">*</span></Label>
              <Input value={formData.class} onChange={(e) => setFormData({ ...formData, class: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date <span className="text-red-500">*</span></Label>
              <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Duration (min)</Label>
              <Input type="number" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Max Marks</Label>
              <Input type="number" value={formData.maxMarks} onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Venue</Label>
              <Input value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Scheduling..." : "Schedule Exam"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Upload Result Form
export function UploadResultForm({ open, onOpenChange, onSuccess }: any) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    studentId: "",
    studentName: "",
    class: "",
    exam: "",
    marks: "",
    maxMarks: "100",
    remarks: "",
  })

  const students = db.getStudents()

  const calculateGrade = (percentage: number) => {
    if (percentage >= 90) return "A+"
    if (percentage >= 80) return "A"
    if (percentage >= 70) return "B+"
    if (percentage >= 60) return "B"
    if (percentage >= 50) return "C"
    if (percentage >= 40) return "D"
    return "F"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (!formData.studentId || !formData.exam || !formData.marks) {
        toast.error("Please fill in all required fields")
        setLoading(false)
        return
      }
      const marks = parseFloat(formData.marks)
      const maxMarks = parseFloat(formData.maxMarks)
      const percentage = (marks / maxMarks) * 100
      const grade = calculateGrade(percentage)

      db.addResult({
        student: formData.studentName,
        studentId: formData.studentId,
        class: formData.class,
        exam: formData.exam,
        marks,
        maxMarks,
        grade,
        percentage,
        status: "published",
        remarks: formData.remarks,
      })
      toast.success("Result uploaded successfully!")
      setFormData({ studentId: "", studentName: "", class: "", exam: "", marks: "", maxMarks: "100", remarks: "" })
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error) {
      toast.error("Failed to upload result")
    } finally {
      setLoading(false)
    }
  }

  const handleStudentChange = (studentId: string) => {
    const student = students.find((s) => s.id === studentId)
    if (student) {
      setFormData({ ...formData, studentId, studentName: student.name, class: student.class })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Upload Result</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Student <span className="text-red-500">*</span></Label>
            <Select value={formData.studentId} onValueChange={handleStudentChange}>
              <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name} - {student.class}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Exam Name <span className="text-red-500">*</span></Label>
            <Input value={formData.exam} onChange={(e) => setFormData({ ...formData, exam: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Marks Obtained <span className="text-red-500">*</span></Label>
              <Input type="number" value={formData.marks} onChange={(e) => setFormData({ ...formData, marks: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Max Marks</Label>
              <Input type="number" value={formData.maxMarks} onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Remarks</Label>
            <Textarea value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Uploading..." : "Upload Result"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Mark Attendance Form
export function MarkAttendanceForm({ open, onOpenChange, onSuccess }: any) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    studentId: "",
    studentName: "",
    class: "",
    date: new Date().toISOString().split("T")[0],
    status: "",
    remarks: "",
  })

  const students = db.getStudents()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (!formData.studentId || !formData.status) {
        toast.error("Please fill in all required fields")
        setLoading(false)
        return
      }
      db.addAttendance(formData as any)
      toast.success("Attendance marked successfully!")
      setFormData({ studentId: "", studentName: "", class: "", date: new Date().toISOString().split("T")[0], status: "", remarks: "" })
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error) {
      toast.error("Failed to mark attendance")
    } finally {
      setLoading(false)
    }
  }

  const handleStudentChange = (studentId: string) => {
    const student = students.find((s) => s.id === studentId)
    if (student) {
      setFormData({ ...formData, studentId, studentName: student.name, class: student.class })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Mark Attendance</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Student <span className="text-red-500">*</span></Label>
            <Select value={formData.studentId} onValueChange={handleStudentChange}>
              <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name} - {student.class}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date <span className="text-red-500">*</span></Label>
              <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Status <span className="text-red-500">*</span></Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="excused">Excused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Remarks</Label>
            <Textarea value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Marking..." : "Mark Attendance"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Create Event Form
export function CreateEventForm({ open, onOpenChange, onSuccess }: any) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    time: "",
    location: "",
    type: "",
    attendees: "0",
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (!formData.name || !formData.date || !formData.location || !formData.type) {
        toast.error("Please fill in all required fields")
        setLoading(false)
        return
      }
      db.addEvent({ ...formData, attendees: parseInt(formData.attendees), status: "upcoming", type: formData.type as any })
      toast.success("Event created successfully!")
      setFormData({ name: "", date: "", time: "", location: "", type: "", attendees: "0", description: "" })
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error) {
      toast.error("Failed to create event")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Create Event</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Event Name <span className="text-red-500">*</span></Label>
            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date <span className="text-red-500">*</span></Label>
              <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Location <span className="text-red-500">*</span></Label>
              <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Type <span className="text-red-500">*</span></Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Meeting">Meeting</SelectItem>
                  <SelectItem value="Sports">Sports</SelectItem>
                  <SelectItem value="Academic">Academic</SelectItem>
                  <SelectItem value="Cultural">Cultural</SelectItem>
                  <SelectItem value="Holiday">Holiday</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Expected Attendees</Label>
            <Input type="number" value={formData.attendees} onChange={(e) => setFormData({ ...formData, attendees: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Event"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Compose Message Form
export function ComposeMessageForm({ open, onOpenChange, onSuccess }: any) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    to: "",
    toEmail: "",
    subject: "",
    body: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (!formData.to || !formData.toEmail || !formData.subject || !formData.body) {
        toast.error("Please fill in all required fields")
        setLoading(false)
        return
      }
      db.addMessage({
        from: "Admin",
        fromEmail: "admin@school.com",
        to: formData.to,
        toEmail: formData.toEmail,
        subject: formData.subject,
        body: formData.body,
        time: new Date().toLocaleString(),
        unread: true,
        starred: false,
        hasAttachment: false,
      })
      toast.success("Message sent successfully!")
      setFormData({ to: "", toEmail: "", subject: "", body: "" })
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error) {
      toast.error("Failed to send message")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Compose Message</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>To (Name) <span className="text-red-500">*</span></Label>
              <Input value={formData.to} onChange={(e) => setFormData({ ...formData, to: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Email <span className="text-red-500">*</span></Label>
              <Input type="email" value={formData.toEmail} onChange={(e) => setFormData({ ...formData, toEmail: e.target.value })} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Subject <span className="text-red-500">*</span></Label>
            <Input value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Message <span className="text-red-500">*</span></Label>
            <Textarea rows={6} value={formData.body} onChange={(e) => setFormData({ ...formData, body: e.target.value })} required />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Sending..." : "Send Message"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// New Announcement Form
export function NewAnnouncementForm({ open, onOpenChange, onSuccess }: any) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "",
    category: "",
    targetAudience: "",
    expiryDate: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (!formData.title || !formData.content || !formData.priority || !formData.category || !formData.targetAudience) {
        toast.error("Please fill in all required fields")
        setLoading(false)
        return
      }
      db.addAnnouncement({
        ...formData,
        date: new Date().toISOString().split("T")[0],
        author: "Admin",
        priority: formData.priority as any,
        category: formData.category as any,
        targetAudience: formData.targetAudience as any,
      })
      toast.success("Announcement created successfully!")
      setFormData({ title: "", content: "", priority: "", category: "", targetAudience: "", expiryDate: "" })
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error) {
      toast.error("Failed to create announcement")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New Announcement</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title <span className="text-red-500">*</span></Label>
            <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Content <span className="text-red-500">*</span></Label>
            <Textarea rows={4} value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority <span className="text-red-500">*</span></Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category <span className="text-red-500">*</span></Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Academic">Academic</SelectItem>
                  <SelectItem value="Event">Event</SelectItem>
                  <SelectItem value="Holiday">Holiday</SelectItem>
                  <SelectItem value="Exam">Exam</SelectItem>
                  <SelectItem value="Fee">Fee</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Target Audience <span className="text-red-500">*</span></Label>
              <Select value={formData.targetAudience} onValueChange={(value) => setFormData({ ...formData, targetAudience: value })}>
                <SelectTrigger><SelectValue placeholder="Select audience" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Students">Students</SelectItem>
                  <SelectItem value="Teachers">Teachers</SelectItem>
                  <SelectItem value="Parents">Parents</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input type="date" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Announcement"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
