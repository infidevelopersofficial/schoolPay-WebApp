"use client"

import { useActionState, useState } from "react"
import { useRouter } from "next/navigation"
import { updateClassAction } from "@/app/(dashboard)/dashboard/classes/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft } from "lucide-react"
import { AsyncCombobox } from "@/components/ui/async-combobox"
import { searchTeachersAction } from "@/app/(dashboard)/dashboard/teachers/actions"
import { useFormEffect } from "@/lib/hooks/use-form-effect"
import type { AsyncSearchOption } from "@/components/ui/async-combobox"

interface EditClassFormProps {
  initialData: {
    id: string
    name: string
    section: string
    classTeacherId: string
    room: string
    capacity: string
  }
  defaultTeachers: { id: string; name: string; email?: string }[]
}

export function EditClassForm({ initialData, defaultTeachers }: EditClassFormProps) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(updateClassAction, null)
  const [classTeacherId, setClassTeacherId] = useState(initialData.classTeacherId || "")

  const defaultOptions: AsyncSearchOption[] = defaultTeachers.map((t) => ({
    value: t.id,
    label: t.name,
    subLabel: t.email,
  }))

  useFormEffect(state, {
    successMessage: "Class updated successfully!",
    defaultErrorMessage: "Failed to update class",
    onSuccess: () => router.push("/dashboard/classes"),
  })

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Class</h1>
          <p className="text-sm text-muted-foreground">{initialData.name} — Section {initialData.section}</p>
        </div>
      </div>

      <form action={formAction} className="space-y-6 bg-card border rounded-xl p-6 shadow-sm">
        <input type="hidden" name="id" value={initialData.id} />
        <input type="hidden" name="classTeacherId" value={classTeacherId} />

        {state?.error && (
          <div className="rounded-md bg-destructive/10 text-destructive text-sm px-4 py-3 border border-destructive/20">
            {state.error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Grade / Name <span className="text-destructive">*</span></Label>
            <Input name="name" defaultValue={initialData.name} placeholder="e.g. Class 10" required />
          </div>
          <div className="space-y-2">
            <Label>Section <span className="text-destructive">*</span></Label>
            <Input name="section" defaultValue={initialData.section} placeholder="e.g. A" required />
          </div>
        </div>

        <div className="space-y-2 flex flex-col">
          <Label>Class Teacher</Label>
          <AsyncCombobox
            value={classTeacherId}
            onValueChange={setClassTeacherId}
            searchAction={searchTeachersAction}
            placeholder="Search teacher..."
            defaultOptions={defaultOptions}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Room Number</Label>
            <Input name="room" defaultValue={initialData.room} placeholder="e.g. 101" />
          </div>
          <div className="space-y-2">
            <Label>Capacity</Label>
            <Input name="capacity" type="number" defaultValue={initialData.capacity} min={1} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/classes")} disabled={isPending}>
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
