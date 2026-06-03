"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { addStudentAction } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export const createStudentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  dateOfBirth: z.string().min(1, "Date of Birth is required"),
  class: z.string().min(1, "Class is required"),
  admissionNumber: z.string().optional().transform(v => v === "" ? undefined : v),
  parentName: z.string().min(1, "Parent Name is required"),
  parentEmail: z.string().email("Valid email required"),
  parentMobile: z.string().regex(/^[0-9]{10}$/, "10-digit mobile number required"),
  sessionId: z.string().optional().transform(v => v === "" ? undefined : v),
  totalFees: z.coerce.number().default(0),
})

export type CreateStudentInput = z.infer<typeof createStudentSchema>

export default function NewStudentPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateStudentInput>({
    resolver: zodResolver(createStudentSchema),
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

  async function onSubmit(data: CreateStudentInput) {
    setIsSubmitting(true)
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString())
      }
    })

    const result = await addStudentAction(null, formData)
    
    setIsSubmitting(false)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success("Student added successfully. Welcome email sent to parent.")
      router.push("/dashboard/students")
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
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Student Name *</Label>
                <Input id="name" {...form.register("name")} placeholder="John Doe" />
                {form.formState.errors.name && <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input id="dateOfBirth" type="date" {...form.register("dateOfBirth")} />
                {form.formState.errors.dateOfBirth && <p className="text-sm text-red-500">{form.formState.errors.dateOfBirth.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="class">Class *</Label>
                <Input id="class" {...form.register("class")} placeholder="e.g. 10A" />
                {form.formState.errors.class && <p className="text-sm text-red-500">{form.formState.errors.class.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="admissionNumber">Admission Number</Label>
                <Input id="admissionNumber" {...form.register("admissionNumber")} placeholder="Optional" />
              </div>
            </div>

            <hr />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Parent Information</h3>
              <div className="space-y-2">
                <Label htmlFor="parentName">Parent Name *</Label>
                <Input id="parentName" {...form.register("parentName")} placeholder="Jane Doe" />
                {form.formState.errors.parentName && <p className="text-sm text-red-500">{form.formState.errors.parentName.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parentEmail">Parent Email *</Label>
                  <Input id="parentEmail" type="email" {...form.register("parentEmail")} placeholder="jane@example.com" />
                  {form.formState.errors.parentEmail && <p className="text-sm text-red-500">{form.formState.errors.parentEmail.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parentMobile">Parent Mobile (10 digits) *</Label>
                  <Input id="parentMobile" type="tel" {...form.register("parentMobile")} placeholder="9876543210" />
                  {form.formState.errors.parentMobile && <p className="text-sm text-red-500">{form.formState.errors.parentMobile.message}</p>}
                </div>
              </div>
            </div>

            <hr />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Initial Fees Setup</h3>
              <div className="space-y-2">
                <Label htmlFor="totalFees">Total Annual/Initial Fees (₹) *</Label>
                <Input id="totalFees" type="number" {...form.register("totalFees")} placeholder="0" />
              </div>
            </div>
            
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="ghost" asChild type="button">
              <Link href="/dashboard/students">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Student
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
