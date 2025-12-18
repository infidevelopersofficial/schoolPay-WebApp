// Simple in-memory database with localStorage persistence
// This can be replaced with a real database (Prisma, MongoDB, etc.) later

import { mockStudents, mockTeachers, mockParents, mockClasses, mockFees, mockPayments } from "./mockData"

// Types
export interface Student {
  id: string
  name: string
  email: string
  phone?: string
  dateOfBirth?: string
  gender?: string
  address?: string
  class: string
  section?: string
  rollNumber?: string
  admissionDate?: string
  feeStatus: "Paid" | "Pending" | "Overdue"
  totalFees: number
  paidAmount: number
  pendingAmount: number
  parentId?: string
  bloodGroup?: string
  emergencyContact?: string
}

export interface Teacher {
  id: string
  name: string
  email: string
  phone: string
  subject: string
  class: string
  dateOfBirth?: string
  gender?: string
  address?: string
  qualification?: string
  experience?: string
  joiningDate?: string
  salary?: number
}

export interface Parent {
  id: string
  name: string
  email: string
  phone: string
  studentName: string
  studentId?: string
  relationship: string
  occupation?: string
  address?: string
  alternatePhone?: string
}

export interface Class {
  id: string
  name: string
  section: string
  strength: number
  classTeacher: string
  classTeacherId?: string
  room?: string
  capacity?: number
}

export interface Subject {
  id: string
  name: string
  code: string
  teacher: string
  teacherId?: string
  classes: number
  students: number
  description?: string
}

export interface Fee {
  id: string
  type: string
  amount: number
  description: string
  frequency?: "Monthly" | "Quarterly" | "Yearly" | "One-time"
  dueDate?: string
  applicableClasses?: string[]
}

export interface Payment {
  id: string
  studentName: string
  studentId: string
  amount: number
  date: string
  method: "Cash" | "Bank Transfer" | "Credit Card" | "Debit Card" | "Cheque" | "Online Payment"
  status: "Completed" | "Pending" | "Failed"
  transactionId?: string
  feeType?: string
  receiptNumber?: string
}

export interface Lesson {
  id: string
  title: string
  subject: string
  subjectId?: string
  class: string
  classId?: string
  teacher: string
  teacherId?: string
  date: string
  time: string
  duration: string
  status: "scheduled" | "completed" | "cancelled"
  description?: string
  materials?: string[]
}

export interface Exam {
  id: string
  name: string
  subject: string
  subjectId?: string
  class: string
  classId?: string
  date: string
  time: string
  duration: string
  maxMarks: number
  status: "scheduled" | "completed" | "cancelled"
  description?: string
  venue?: string
}

export interface Result {
  id: string
  student: string
  studentId: string
  class: string
  exam: string
  examId?: string
  marks: number
  maxMarks: number
  grade: string
  percentage: number
  status: "published" | "draft"
  remarks?: string
}

export interface Attendance {
  id: string
  studentId: string
  studentName: string
  class: string
  date: string
  status: "present" | "absent" | "late" | "excused"
  remarks?: string
}

export interface Event {
  id: string
  name: string
  date: string
  time: string
  location: string
  type: "Meeting" | "Sports" | "Academic" | "Cultural" | "Holiday" | "Other"
  attendees: number
  status: "upcoming" | "completed" | "cancelled"
  description: string
  organizer?: string
}

export interface Message {
  id: string
  from: string
  fromEmail: string
  to: string
  toEmail: string
  subject: string
  body: string
  time: string
  unread: boolean
  starred: boolean
  hasAttachment: boolean
  attachments?: string[]
}

export interface Announcement {
  id: string
  title: string
  content: string
  date: string
  author: string
  priority: "low" | "medium" | "high" | "urgent"
  category: "General" | "Academic" | "Event" | "Holiday" | "Exam" | "Fee"
  targetAudience: "All" | "Students" | "Teachers" | "Parents"
  expiryDate?: string
}

// Database class
class Database {
  private students: Student[] = []
  private teachers: Teacher[] = []
  private parents: Parent[] = []
  private classes: Class[] = []
  private subjects: Subject[] = []
  private fees: Fee[] = []
  private payments: Payment[] = []
  private lessons: Lesson[] = []
  private exams: Exam[] = []
  private results: Result[] = []
  private attendance: Attendance[] = []
  private events: Event[] = []
  private messages: Message[] = []
  private announcements: Announcement[] = []

  constructor() {
    this.loadFromStorage()
  }

  private loadFromStorage() {
    if (typeof window === "undefined") return

    try {
      const data = localStorage.getItem("schoolpay_db")
      if (data) {
        const parsed = JSON.parse(data)
        this.students = parsed.students || mockStudents
        this.teachers = parsed.teachers || mockTeachers
        this.parents = parsed.parents || mockParents
        this.classes = parsed.classes || mockClasses
        this.subjects = parsed.subjects || []
        this.fees = parsed.fees || mockFees
        this.payments = parsed.payments || mockPayments
        this.lessons = parsed.lessons || []
        this.exams = parsed.exams || []
        this.results = parsed.results || []
        this.attendance = parsed.attendance || []
        this.events = parsed.events || []
        this.messages = parsed.messages || []
        this.announcements = parsed.announcements || []
      } else {
        // Initialize with mock data
        this.students = mockStudents
        this.teachers = mockTeachers
        this.parents = mockParents
        this.classes = mockClasses
        this.fees = mockFees
        this.payments = mockPayments
        this.saveToStorage()
      }
    } catch (error) {
      console.error("Error loading from storage:", error)
      // Fallback to mock data
      this.students = mockStudents
      this.teachers = mockTeachers
      this.parents = mockParents
      this.classes = mockClasses
      this.fees = mockFees
      this.payments = mockPayments
    }
  }

  private saveToStorage() {
    if (typeof window === "undefined") return

    try {
      const data = {
        students: this.students,
        teachers: this.teachers,
        parents: this.parents,
        classes: this.classes,
        subjects: this.subjects,
        fees: this.fees,
        payments: this.payments,
        lessons: this.lessons,
        exams: this.exams,
        results: this.results,
        attendance: this.attendance,
        events: this.events,
        messages: this.messages,
        announcements: this.announcements,
      }
      localStorage.setItem("schoolpay_db", JSON.stringify(data))
    } catch (error) {
      console.error("Error saving to storage:", error)
    }
  }

  // Students
  getStudents() {
    return this.students
  }

  getStudent(id: string) {
    return this.students.find((s) => s.id === id)
  }

  addStudent(student: Omit<Student, "id">) {
    const newStudent = { ...student, id: Date.now().toString() }
    this.students.push(newStudent)
    this.saveToStorage()
    return newStudent
  }

  updateStudent(id: string, student: Partial<Student>) {
    const index = this.students.findIndex((s) => s.id === id)
    if (index !== -1) {
      this.students[index] = { ...this.students[index], ...student }
      this.saveToStorage()
      return this.students[index]
    }
    return null
  }

  deleteStudent(id: string) {
    this.students = this.students.filter((s) => s.id !== id)
    this.saveToStorage()
  }

  // Teachers
  getTeachers() {
    return this.teachers
  }

  getTeacher(id: string) {
    return this.teachers.find((t) => t.id === id)
  }

  addTeacher(teacher: Omit<Teacher, "id">) {
    const newTeacher = { ...teacher, id: Date.now().toString() }
    this.teachers.push(newTeacher)
    this.saveToStorage()
    return newTeacher
  }

  updateTeacher(id: string, teacher: Partial<Teacher>) {
    const index = this.teachers.findIndex((t) => t.id === id)
    if (index !== -1) {
      this.teachers[index] = { ...this.teachers[index], ...teacher }
      this.saveToStorage()
      return this.teachers[index]
    }
    return null
  }

  deleteTeacher(id: string) {
    this.teachers = this.teachers.filter((t) => t.id !== id)
    this.saveToStorage()
  }

  // Parents
  getParents() {
    return this.parents
  }

  getParent(id: string) {
    return this.parents.find((p) => p.id === id)
  }

  addParent(parent: Omit<Parent, "id">) {
    const newParent = { ...parent, id: Date.now().toString() }
    this.parents.push(newParent)
    this.saveToStorage()
    return newParent
  }

  updateParent(id: string, parent: Partial<Parent>) {
    const index = this.parents.findIndex((p) => p.id === id)
    if (index !== -1) {
      this.parents[index] = { ...this.parents[index], ...parent }
      this.saveToStorage()
      return this.parents[index]
    }
    return null
  }

  deleteParent(id: string) {
    this.parents = this.parents.filter((p) => p.id !== id)
    this.saveToStorage()
  }

  // Classes
  getClasses() {
    return this.classes
  }

  getClass(id: string) {
    return this.classes.find((c) => c.id === id)
  }

  addClass(classData: Omit<Class, "id">) {
    const newClass = { ...classData, id: Date.now().toString() }
    this.classes.push(newClass)
    this.saveToStorage()
    return newClass
  }

  updateClass(id: string, classData: Partial<Class>) {
    const index = this.classes.findIndex((c) => c.id === id)
    if (index !== -1) {
      this.classes[index] = { ...this.classes[index], ...classData }
      this.saveToStorage()
      return this.classes[index]
    }
    return null
  }

  deleteClass(id: string) {
    this.classes = this.classes.filter((c) => c.id !== id)
    this.saveToStorage()
  }

  // Subjects
  getSubjects() {
    return this.subjects
  }

  getSubject(id: string) {
    return this.subjects.find((s) => s.id === id)
  }

  addSubject(subject: Omit<Subject, "id">) {
    const newSubject = { ...subject, id: Date.now().toString() }
    this.subjects.push(newSubject)
    this.saveToStorage()
    return newSubject
  }

  updateSubject(id: string, subject: Partial<Subject>) {
    const index = this.subjects.findIndex((s) => s.id === id)
    if (index !== -1) {
      this.subjects[index] = { ...this.subjects[index], ...subject }
      this.saveToStorage()
      return this.subjects[index]
    }
    return null
  }

  deleteSubject(id: string) {
    this.subjects = this.subjects.filter((s) => s.id !== id)
    this.saveToStorage()
  }

  // Fees
  getFees() {
    return this.fees
  }

  getFee(id: string) {
    return this.fees.find((f) => f.id === id)
  }

  addFee(fee: Omit<Fee, "id">) {
    const newFee = { ...fee, id: Date.now().toString() }
    this.fees.push(newFee)
    this.saveToStorage()
    return newFee
  }

  updateFee(id: string, fee: Partial<Fee>) {
    const index = this.fees.findIndex((f) => f.id === id)
    if (index !== -1) {
      this.fees[index] = { ...this.fees[index], ...fee }
      this.saveToStorage()
      return this.fees[index]
    }
    return null
  }

  deleteFee(id: string) {
    this.fees = this.fees.filter((f) => f.id !== id)
    this.saveToStorage()
  }

  // Payments
  getPayments() {
    return this.payments
  }

  getPayment(id: string) {
    return this.payments.find((p) => p.id === id)
  }

  addPayment(payment: Omit<Payment, "id">) {
    const newPayment = { ...payment, id: Date.now().toString() }
    this.payments.push(newPayment)
    this.saveToStorage()
    return newPayment
  }

  updatePayment(id: string, payment: Partial<Payment>) {
    const index = this.payments.findIndex((p) => p.id === id)
    if (index !== -1) {
      this.payments[index] = { ...this.payments[index], ...payment }
      this.saveToStorage()
      return this.payments[index]
    }
    return null
  }

  deletePayment(id: string) {
    this.payments = this.payments.filter((p) => p.id !== id)
    this.saveToStorage()
  }

  // Lessons
  getLessons() {
    return this.lessons
  }

  getLesson(id: string) {
    return this.lessons.find((l) => l.id === id)
  }

  addLesson(lesson: Omit<Lesson, "id">) {
    const newLesson = { ...lesson, id: Date.now().toString() }
    this.lessons.push(newLesson)
    this.saveToStorage()
    return newLesson
  }

  updateLesson(id: string, lesson: Partial<Lesson>) {
    const index = this.lessons.findIndex((l) => l.id === id)
    if (index !== -1) {
      this.lessons[index] = { ...this.lessons[index], ...lesson }
      this.saveToStorage()
      return this.lessons[index]
    }
    return null
  }

  deleteLesson(id: string) {
    this.lessons = this.lessons.filter((l) => l.id !== id)
    this.saveToStorage()
  }

  // Exams
  getExams() {
    return this.exams
  }

  getExam(id: string) {
    return this.exams.find((e) => e.id === id)
  }

  addExam(exam: Omit<Exam, "id">) {
    const newExam = { ...exam, id: Date.now().toString() }
    this.exams.push(newExam)
    this.saveToStorage()
    return newExam
  }

  updateExam(id: string, exam: Partial<Exam>) {
    const index = this.exams.findIndex((e) => e.id === id)
    if (index !== -1) {
      this.exams[index] = { ...this.exams[index], ...exam }
      this.saveToStorage()
      return this.exams[index]
    }
    return null
  }

  deleteExam(id: string) {
    this.exams = this.exams.filter((e) => e.id !== id)
    this.saveToStorage()
  }

  // Results
  getResults() {
    return this.results
  }

  getResult(id: string) {
    return this.results.find((r) => r.id === id)
  }

  addResult(result: Omit<Result, "id">) {
    const newResult = { ...result, id: Date.now().toString() }
    this.results.push(newResult)
    this.saveToStorage()
    return newResult
  }

  updateResult(id: string, result: Partial<Result>) {
    const index = this.results.findIndex((r) => r.id === id)
    if (index !== -1) {
      this.results[index] = { ...this.results[index], ...result }
      this.saveToStorage()
      return this.results[index]
    }
    return null
  }

  deleteResult(id: string) {
    this.results = this.results.filter((r) => r.id !== id)
    this.saveToStorage()
  }

  // Attendance
  getAttendance() {
    return this.attendance
  }

  getAttendanceRecord(id: string) {
    return this.attendance.find((a) => a.id === id)
  }

  addAttendance(attendance: Omit<Attendance, "id">) {
    const newAttendance = { ...attendance, id: Date.now().toString() }
    this.attendance.push(newAttendance)
    this.saveToStorage()
    return newAttendance
  }

  updateAttendance(id: string, attendance: Partial<Attendance>) {
    const index = this.attendance.findIndex((a) => a.id === id)
    if (index !== -1) {
      this.attendance[index] = { ...this.attendance[index], ...attendance }
      this.saveToStorage()
      return this.attendance[index]
    }
    return null
  }

  deleteAttendance(id: string) {
    this.attendance = this.attendance.filter((a) => a.id !== id)
    this.saveToStorage()
  }

  // Events
  getEvents() {
    return this.events
  }

  getEvent(id: string) {
    return this.events.find((e) => e.id === id)
  }

  addEvent(event: Omit<Event, "id">) {
    const newEvent = { ...event, id: Date.now().toString() }
    this.events.push(newEvent)
    this.saveToStorage()
    return newEvent
  }

  updateEvent(id: string, event: Partial<Event>) {
    const index = this.events.findIndex((e) => e.id === id)
    if (index !== -1) {
      this.events[index] = { ...this.events[index], ...event }
      this.saveToStorage()
      return this.events[index]
    }
    return null
  }

  deleteEvent(id: string) {
    this.events = this.events.filter((e) => e.id !== id)
    this.saveToStorage()
  }

  // Messages
  getMessages() {
    return this.messages
  }

  getMessage(id: string) {
    return this.messages.find((m) => m.id === id)
  }

  addMessage(message: Omit<Message, "id">) {
    const newMessage = { ...message, id: Date.now().toString() }
    this.messages.push(newMessage)
    this.saveToStorage()
    return newMessage
  }

  updateMessage(id: string, message: Partial<Message>) {
    const index = this.messages.findIndex((m) => m.id === id)
    if (index !== -1) {
      this.messages[index] = { ...this.messages[index], ...message }
      this.saveToStorage()
      return this.messages[index]
    }
    return null
  }

  deleteMessage(id: string) {
    this.messages = this.messages.filter((m) => m.id !== id)
    this.saveToStorage()
  }

  // Announcements
  getAnnouncements() {
    return this.announcements
  }

  getAnnouncement(id: string) {
    return this.announcements.find((a) => a.id === id)
  }

  addAnnouncement(announcement: Omit<Announcement, "id">) {
    const newAnnouncement = { ...announcement, id: Date.now().toString() }
    this.announcements.push(newAnnouncement)
    this.saveToStorage()
    return newAnnouncement
  }

  updateAnnouncement(id: string, announcement: Partial<Announcement>) {
    const index = this.announcements.findIndex((a) => a.id === id)
    if (index !== -1) {
      this.announcements[index] = { ...this.announcements[index], ...announcement }
      this.saveToStorage()
      return this.announcements[index]
    }
    return null
  }

  deleteAnnouncement(id: string) {
    this.announcements = this.announcements.filter((a) => a.id !== id)
    this.saveToStorage()
  }
}

// Export singleton instance
export const db = new Database()
