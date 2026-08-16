"use client"

import { useActionState, useState } from "react"
import { useRouter } from "next/navigation"
import { updateSubjectAction } from "@/app/(dashboard)/dashboard/subjects/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft } from "lucide-react"
import { AsyncCombobox } from "@/components/ui/async-combobox"
import { searchTeachersAction } from "@/app/(dashboard)/dashboard/teachers/actions"
import { useFormEffect } from "@/lib/hooks/use-form-effect"
import type { AsyncSearchOption } from "@/components/ui/async-combobox"

interface EditSubjectFormProps {
  initialData: {
    id: string
    name: string
    code: string
    description: string
    teacherId: string
  }
  defaultTeachers: { id: string; name: string; email?: string }[]
}

export function EditSubjectForm({ initialData, defaultTeachers }: EditSubjectFormProps) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(updateSubjectAction, null)
  const [teacherId, setTeacherId] = useState(initialData.teacherId || "")

  const defaultOptions: AsyncSearchOption[] = defaultTeachers.map((t) => ({
    value: t.id,
    label: t.name,
    subLabel: t.email,
  }))

  useFormEffect(state, {
    successMessage: "Subject updated successfully!",
    defaultErrorMessage: "Failed to update subject",
    onSuccess: () => router.push("/dashboard/subjects"),
  })

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Subject</h1>
          <p className="text-sm text-muted-foreground">{initialData.name} ({initialData.code})</p>
        </div>
      </div>

      <form action={formAction} className="space-y-6 bg-card border rounded-xl p-6 shadow-sm">
        <input type="hidden" name="id" value={initialData.id} />
        <input type="hidden" name="teacherId" value={teacherId} />

        {state?.error && (
          <div className="rounded-md bg-destructive/10 text-destructive text-sm px-4 py-3 border border-destructive/20">
            {typeof state.error === "string" ? state.error : "Validation failed"}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Subject Name <span className="text-destructive">*</span></Label>
            <Input name="name" defaultValue={initialData.name} placeholder="e.g. Mathematics" required />
          </div>
          <div className="space-y-2">
            <Label>Subject Code <span className="text-destructive">*</span></Label>
            <Input name="code" defaultValue={initialData.code} placeholder="e.g. MATH101" required />
          </div>
        </div>

        <div className="space-y-2 flex flex-col">
          <Label>Assigned Teacher</Label>
          <AsyncCombobox
            value={teacherId}
            onValueChange={setTeacherId}
            searchAction={searchTeachersAction}
            placeholder="Search teacher..."
            defaultOptions={defaultOptions}
          />
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Input name="description" defaultValue={initialData.description} placeholder="Optional syllabus or description" />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/subjects")} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
