"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { addStudentAction, getClassesForStudentAction, createClassInlineAction } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { ArrowLeft, Loader2, Plus, Check } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

// Helper to convert DD/MM/YYYY or YYYY-MM-DD into a standard ISO string (YYYY-MM-DD)
function parseDateToISO(val: string): string {
  const trimmed = val.trim()
  const ddmmyyyyRegex = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/
  const match = trimmed.match(ddmmyyyyRegex)
  if (match) {
    const day = parseInt(match[1], 10)
    const month = parseInt(match[2], 10) - 1
    const year = parseInt(match[3], 10)
    const date = new Date(Date.UTC(year, month, day))
    return date.toISOString().split("T")[0]
  }
  const date = new Date(trimmed)
  if (!isNaN(date.getTime())) {
    return date.toISOString().split("T")[0]
  }
  return trimmed
}

export const createStudentSchema = z.object({
  name: z.string().trim().min(1, "Student Name is required"),
  dateOfBirth: z.string().trim().min(1, "Date of Birth is required").superRefine((val, ctx) => {
    let date: Date | null = null
    const ddmmyyyyRegex = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/
    const match = val.match(ddmmyyyyRegex)
    if (match) {
      const day = parseInt(match[1], 10)
      const month = parseInt(match[2], 10) - 1
      const year = parseInt(match[3], 10)
      date = new Date(Date.UTC(year, month, day))
      if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month || date.getUTCDate() !== day) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid date: date does not exist (e.g. 31/02/2020).",
        })
        return
      }
    } else {
      date = new Date(val)
      if (isNaN(date.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Date of Birth must be in YYYY-MM-DD or DD/MM/YYYY format.",
        })
        return
      }
    }

    const now = new Date()
    if (date > now) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Date of Birth cannot be in the future.",
      })
      return
    }

    let age = now.getFullYear() - date.getUTCFullYear()
    const monthDiff = now.getMonth() - date.getUTCMonth()
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getUTCDate())) {
      age--
    }

    if (age < 3 || age > 25) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Student age must be realistic (between 3 and 25 years old).`,
      })
      return
    }
  }),
  class: z.string().trim().min(1, "Please select a valid class"),
  admissionNumber: z.string().trim().optional().transform(v => v === "" ? undefined : v),
  parentName: z.string().trim().min(1, "Parent Name is required"),
  parentEmail: z.string().trim().min(1, "Parent Email is required").email("Parent email format is invalid"),
  parentMobile: z.string()
    .min(1, "Parent Mobile is required")
    .transform(val => val.replace(/[\s\-\(\)\.]/g, ""))
    .refine(val => /^[0-9]{10}$/.test(val), {
      message: "Parent mobile must be exactly 10 numeric digits",
    }),
  sessionId: z.string().trim().optional().transform(v => v === "" ? undefined : v),
  totalFees: z.coerce.number({ message: "Total Fees must be a valid number" })
    .min(0, "Total Fees must be a non-negative number (>= 0)"),
})

export type CreateStudentInput = z.infer<typeof createStudentSchema>

export default function NewStudentPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [classes, setClasses] = useState<{ id: string; name: string; section: string; label: string; val: string }[]>([])
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [showNewClassInput, setShowNewClassInput] = useState(false)
  const [newClassName, setNewClassName] = useState("")
  const [newClassSection, setNewClassSection] = useState("")
  const [creatingClass, setCreatingClass] = useState(false)

  useEffect(() => {
    async function loadClasses() {
      setLoadingClasses(true)
      const res = await getClassesForStudentAction()
      if (res && "classes" in res && res.classes) {
        setClasses(res.classes)
      } else {
        toast.error("Failed to load classes")
      }
      setLoadingClasses(false)
    }
    loadClasses()
  }, [])

  const form = useForm<CreateStudentInput>({
    resolver: zodResolver(createStudentSchema) as any,
    defaultValues: {
      name: "",
      dateOfBirth: "",
      class: "",
      admissionNumber: "",
      parentName: "",
      parentEmail: "",
      parentMobile: "",
      totalFees: 0,
      sessionId: "",
    },
  })

  async function handleCreateInlineClass() {
    if (!newClassName.trim()) {
      toast.error("Please enter a class name (e.g. 10)")
      return
    }
    setCreatingClass(true)
    const res = await createClassInlineAction(newClassName, newClassSection)
    setCreatingClass(false)
    if (res && "classItem" in res && res.classItem) {
      toast.success("Class created and selected!")
      setClasses(prev => [...prev, res.classItem!])
      form.setValue("class", res.classItem.val, { shouldValidate: true })
      setNewClassName("")
      setNewClassSection("")
      setShowNewClassInput(false)
    } else {
      toast.error((res && "error" in res ? res.error : null) || "Failed to create class")
    }
  }

  // Trigger warning toast on front-end validation failure
  function onInvalid(errors: any) {
    console.warn("Front-end validation failed:", errors)
    toast.warning("Please fix the highlighted fields before saving.")
  }

  async function onSubmit(data: CreateStudentInput) {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      
      // Convert date of birth to standard ISO string before sending to API
      const isoDate = parseDateToISO(data.dateOfBirth)
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === "dateOfBirth") {
            formData.append("dateOfBirth", isoDate)
          } else {
            formData.append(key, value.toString())
          }
        }
      })

      const result = await addStudentAction(null, formData)
      
      if (result?.error || result?.fieldErrors) {
        let errorMessage = result.error || "An error occurred while saving student details."
        
        // Handle field-specific backend validation errors
        if (result.fieldErrors && typeof result.fieldErrors === "object") {
          const fields = Object.keys(result.fieldErrors)
          if (fields.length > 0) {
            const firstField = fields[0]
            const firstErrList = (result.fieldErrors as Record<string, string[]>)[firstField]
            if (Array.isArray(firstErrList) && firstErrList.length > 0) {
              errorMessage = firstErrList[0]
            }
            // Attach server errors directly to fields so inline messages appear
            fields.forEach((field) => {
              const errs = (result.fieldErrors as Record<string, string[]>)[field]
              if (Array.isArray(errs) && errs.length > 0) {
                form.setError(field as any, { type: "server", message: errs[0] })
              }
            })
          }
        }

        // Parse JSON array error string if backend returned Zod serialization or raw JSON
        if (typeof errorMessage === "string" && (errorMessage.startsWith("[") || errorMessage.includes("Failed to create student: ["))) {
          try {
            const jsonIdx = errorMessage.indexOf("[")
            const jsonStr = errorMessage.substring(jsonIdx)
            const parsed = JSON.parse(jsonStr)
            if (Array.isArray(parsed) && parsed[0]?.message) {
              errorMessage = parsed[0].message
              if (parsed[0]?.path?.[0]) {
                form.setError(parsed[0].path[0] as any, { type: "server", message: parsed[0].message })
              }
            }
          } catch {
            // Ignore JSON parse failure
          }
        }

        // Clean up formatting for toast display
        let cleanMessage = errorMessage
        if (typeof cleanMessage === "string") {
          if (cleanMessage.startsWith("Failed to create student: ")) {
            cleanMessage = cleanMessage.replace("Failed to create student: ", "")
          }
          if (cleanMessage === "Invalid data provided." || cleanMessage === "Validation failed") {
            cleanMessage = "Please check input formatting and try again."
          }
        }

        toast.error(`Failed to Save: ${cleanMessage}`)
        return
      }

      toast.success(`Student '${data.name}' added successfully!`)
      form.reset()
      router.push("/dashboard/students")
    } catch (error: any) {
      console.error("Unexpected error submitting student form:", error)
      toast.error(`Failed to Save: ${error?.message || "An unexpected system error occurred."}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/students">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Add New Student</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Details</CardTitle>
          <CardDescription>Enter the primary details of the new student and their parent.</CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
          <CardContent className="space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Student Name *</Label>
                <Input id="name" {...form.register("name")} placeholder="John Doe" />
                {form.formState.errors.name && <p className="text-sm text-red-500 mt-1 font-medium">{form.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input id="dateOfBirth" type="text" {...form.register("dateOfBirth")} placeholder="YYYY-MM-DD or DD/MM/YYYY" />
                {form.formState.errors.dateOfBirth && <p className="text-sm text-red-500 mt-1 font-medium">{form.formState.errors.dateOfBirth.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="class">Class *</Label>
                  <button
                    type="button"
                    onClick={() => setShowNewClassInput(!showNewClassInput)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Plus className="h-3 w-3" />
                    {showNewClassInput ? "Cancel New Class" : "Create New Class"}
                  </button>
                </div>

                {showNewClassInput ? (
                  <div className="p-3 bg-muted/50 rounded-lg border space-y-3 animate-in fade-in slide-in-from-top-1">
                    <div className="text-xs font-medium text-muted-foreground">Add Class Inline</div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Class (e.g. 10)"
                        value={newClassName}
                        onChange={e => setNewClassName(e.target.value)}
                        className="h-8 text-sm"
                      />
                      <Input
                        placeholder="Sec (e.g. A)"
                        value={newClassSection}
                        onChange={e => setNewClassSection(e.target.value)}
                        className="h-8 w-24 text-sm"
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={creatingClass || !newClassName.trim()}
                        onClick={handleCreateInlineClass}
                        className="h-8 px-3"
                      >
                        {creatingClass ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                        Add
                      </Button>
                    </div>
                  </div>
                ) : null}

                {loadingClasses ? (
                  <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/30 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading available classes...
                  </div>
                ) : (
                  <select
                    id="class"
                    {...form.register("class")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select a class...</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.val}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                )}
                {form.formState.errors.class && <p className="text-sm text-red-500 mt-1 font-medium">{form.formState.errors.class.message}</p>}
                {classes.length === 0 && !loadingClasses && !showNewClassInput && (
                  <p className="text-xs text-amber-600">No classes found. Click &quot;Create New Class&quot; above or visit <Link href="/dashboard/classes" className="underline font-medium">Class Management</Link>.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="admissionNumber">Admission Number</Label>
                <Input id="admissionNumber" {...form.register("admissionNumber")} placeholder="Optional" />
                {form.formState.errors.admissionNumber && <p className="text-sm text-red-500 mt-1 font-medium">{form.formState.errors.admissionNumber.message}</p>}
              </div>
            </div>

            <hr />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Parent Information</h3>
              <div className="space-y-2">
                <Label htmlFor="parentName">Parent Name *</Label>
                <Input id="parentName" {...form.register("parentName")} placeholder="Jane Doe" />
                {form.formState.errors.parentName && <p className="text-sm text-red-500 mt-1 font-medium">{form.formState.errors.parentName.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parentEmail">Parent Email *</Label>
                  <Input id="parentEmail" type="email" {...form.register("parentEmail")} placeholder="jane@example.com" />
                  {form.formState.errors.parentEmail && <p className="text-sm text-red-500 mt-1 font-medium">{form.formState.errors.parentEmail.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parentMobile">Parent Mobile (10 digits) *</Label>
                  <Input id="parentMobile" type="tel" {...form.register("parentMobile")} placeholder="9876543210" />
                  {form.formState.errors.parentMobile && <p className="text-sm text-red-500 mt-1 font-medium">{form.formState.errors.parentMobile.message}</p>}
                </div>
              </div>
            </div>

            <hr />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Initial Fees Setup</h3>
              <div className="space-y-2">
                <Label htmlFor="totalFees">Total Annual/Initial Fees (₹) *</Label>
                <Input id="totalFees" type="number" step="any" {...form.register("totalFees")} placeholder="0" />
                {form.formState.errors.totalFees && <p className="text-sm text-red-500 mt-1 font-medium">{form.formState.errors.totalFees.message}</p>}
              </div>
            </div>
            
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="ghost" asChild type="button">
              <Link href="/dashboard/students">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Saving..." : "Save Student"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
