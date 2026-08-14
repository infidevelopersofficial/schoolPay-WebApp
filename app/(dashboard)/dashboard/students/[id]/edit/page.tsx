"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { updateStudentAction, getClassesForStudentAction } from "../../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { use } from "react"

// Edit schema — all fields optional except name and class
const editStudentSchema = z.object({
  name: z.string().trim().min(1, "Student Name is required"),
  class: z.string().trim().min(1, "Please select a class"),
  section: z.string().trim().optional(),
  dateOfBirth: z.string().trim().optional().transform(v => v === "" ? undefined : v),
  gender: z.string().trim().optional().transform(v => v === "" ? undefined : v),
  rollNumber: z.string().trim().optional().transform(v => v === "" ? undefined : v),
  bloodGroup: z.string().trim().optional().transform(v => v === "" ? undefined : v),
  emergencyContact: z.string().trim().optional().transform(v => v === "" ? undefined : v),
  address: z.string().trim().optional().transform(v => v === "" ? undefined : v),
  totalFees: z.coerce.number().min(0, "Total Fees must be >= 0").optional().default(0),
})

type EditStudentInput = z.infer<typeof editStudentSchema>

// Inner client component that receives pre-loaded data
function EditStudentForm({ studentId, initialData }: {
  studentId: string
  initialData: {
    name: string
    class: string
    section?: string
    dateOfBirth?: string
    gender?: string
    rollNumber?: string
    bloodGroup?: string
    emergencyContact?: string
    address?: string
    totalFees?: number
    parentName?: string
    parentEmail?: string
    parentMobile?: string
    parentId?: string
  }
}) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [classes, setClasses] = useState<{ id: string; name: string; section: string; label: string; val: string }[]>([])
  const [loadingClasses, setLoadingClasses] = useState(true)

  useEffect(() => {
    async function loadClasses() {
      const res = await getClassesForStudentAction()
      if (res && "classes" in res && res.classes) {
        setClasses(res.classes)
      }
      setLoadingClasses(false)
    }
    loadClasses()
  }, [])

  const form = useForm<EditStudentInput>({
    resolver: zodResolver(editStudentSchema) as any,
    defaultValues: {
      name: initialData.name || "",
      class: initialData.class || "",
      section: initialData.section || "",
      dateOfBirth: initialData.dateOfBirth || "",
      gender: initialData.gender || "",
      rollNumber: initialData.rollNumber || "",
      bloodGroup: initialData.bloodGroup || "",
      emergencyContact: initialData.emergencyContact || "",
      address: initialData.address || "",
      totalFees: initialData.totalFees ?? 0,
    },
  })

  function onInvalid(errors: any) {
    toast.warning("Please fix the highlighted fields before saving.")
  }

  async function onSubmit(data: EditStudentInput) {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("id", studentId)

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString())
        }
      })

      const result = await updateStudentAction(null, formData)

      if (result && ('error' in result || 'fieldErrors' in result)) {
        let errorMessage = ('error' in result && typeof result.error === 'string') ? result.error : "An error occurred while updating student details."
        if ('fieldErrors' in result && result.fieldErrors && typeof result.fieldErrors === "object") {
          const fields = Object.keys(result.fieldErrors)
          if (fields.length > 0) {
            const firstErrList = (result.fieldErrors as Record<string, string[]>)[fields[0]]
            if (Array.isArray(firstErrList) && firstErrList.length > 0) {
              errorMessage = firstErrList[0]
            }
            fields.forEach((field) => {
              const errs = (result.fieldErrors as Record<string, string[]>)[field]
              if (Array.isArray(errs) && errs.length > 0) {
                form.setError(field as any, { type: "server", message: errs[0] })
              }
            })
          }
        }
        toast.error(`Failed to Update: ${errorMessage}`)
        return
      }

      toast.success("Student updated successfully!")
      router.push("/dashboard/students")
    } catch (error: any) {
      toast.error(`Failed to Update: ${error?.message || "An unexpected error occurred."}`)
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
        <h1 className="text-2xl font-bold tracking-tight">Edit Student</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Details</CardTitle>
          <CardDescription>Update the student's information below.</CardDescription>
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
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input id="dateOfBirth" type="date" {...form.register("dateOfBirth")} />
                {form.formState.errors.dateOfBirth && <p className="text-sm text-red-500 mt-1 font-medium">{String(form.formState.errors.dateOfBirth.message)}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="class">Class *</Label>
                {loadingClasses ? (
                  <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/30 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading classes...
                  </div>
                ) : (
                  <select
                    id="class"
                    {...form.register("class")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select a class...</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.val}>{c.label}</option>
                    ))}
                  </select>
                )}
                {form.formState.errors.class && <p className="text-sm text-red-500 mt-1 font-medium">{form.formState.errors.class.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Input id="section" {...form.register("section")} placeholder="e.g. A" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  {...form.register("gender")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select gender...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rollNumber">Roll Number</Label>
                <Input id="rollNumber" {...form.register("rollNumber")} placeholder="001" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bloodGroup">Blood Group</Label>
                <Input id="bloodGroup" {...form.register("bloodGroup")} placeholder="A+" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact</Label>
                <Input id="emergencyContact" {...form.register("emergencyContact")} placeholder="+91 9876543210" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...form.register("address")} placeholder="123 Main St, City, State" />
            </div>

            <hr />

            {/* Parent info (read-only) */}
            {initialData.parentName && (
              <div className="space-y-2 p-4 bg-muted/40 rounded-lg border">
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground">Parent / Guardian</Label>
                  {initialData.parentId && (
                    <Link href={`/dashboard/parents/${initialData.parentId}/edit`} className="text-xs text-primary hover:underline">
                      Edit Parent Details ↗
                    </Link>
                  )}
                </div>
                <p className="text-sm font-medium">{initialData.parentName}</p>
                <p className="text-xs text-muted-foreground">{initialData.parentEmail || "No email"} • {initialData.parentMobile || "No mobile"}</p>
              </div>
            )}

            <hr />

            <div className="space-y-2">
              <Label htmlFor="totalFees">Total Annual/Initial Fees (₹)</Label>
              <Input id="totalFees" type="number" step="any" {...form.register("totalFees")} placeholder="0" />
              {form.formState.errors.totalFees && <p className="text-sm text-red-500 mt-1 font-medium">{form.formState.errors.totalFees.message}</p>}
            </div>

          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="ghost" asChild type="button">
              <Link href="/dashboard/students">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

// Server-compatible wrapper — receives params as a Promise in Next.js 15
export default function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  // We use a client component with useEffect to fetch student data since 
  // this whole file is "use client" — fetch via server action pattern
  return <EditStudentLoader studentId={id} />
}

function EditStudentLoader({ studentId }: { studentId: string }) {
  const router = useRouter()
  const [initialData, setInitialData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function fetchStudent() {
      try {
        const { getStudentForEditAction } = await import("../../actions")
        const result = await getStudentForEditAction(studentId)
        if (result && 'student' in result) {
          setInitialData(result.student as any)
        } else {
          setNotFound(true)
        }
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    fetchStudent()
  }, [studentId])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/students"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Edit Student</h1>
        </div>
        <Card>
          <CardContent className="py-16 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/students"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Student Not Found</h1>
        </div>
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <p>This student could not be found. They may have been deleted.</p>
            <Button className="mt-4" asChild><Link href="/dashboard/students">Back to Students</Link></Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <EditStudentForm studentId={studentId} initialData={initialData} />
}
