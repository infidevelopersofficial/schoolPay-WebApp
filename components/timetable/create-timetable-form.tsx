"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { createTimetableAction } from "@/app/(dashboard)/dashboard/timetable/actions"
import { toast } from "sonner"

interface CreateTimetableFormProps {
  classes: { id: string; name: string; section: string }[]
  sessions: { id: string; name: string }[]
}

export function CreateTimetableForm({ classes, sessions }: CreateTimetableFormProps) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(createTimetableAction, null)

  useEffect(() => {
    if (state?.success && state.timetableId) {
      toast.success("Timetable created successfully")
      router.push(`/dashboard/timetable/${state.timetableId}`)
    } else if (state?.error) {
      toast.error(state.error)
    }
  }, [state, router])

  return (
    <Card>
      <form action={formAction}>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="classId">Select Class</Label>
            <Select name="classId" required>
              <SelectTrigger id="classId">
                <SelectValue placeholder="Select class..." />
              </SelectTrigger>
              <SelectContent>
                {classes.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name} {c.section}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state?.fieldErrors?.classId && (
              <p className="text-sm text-destructive">{state.fieldErrors.classId[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sessionId">Academic Session</Label>
            <Select name="sessionId" required defaultValue={sessions[0]?.id}>
              <SelectTrigger id="sessionId">
                <SelectValue placeholder="Select session..." />
              </SelectTrigger>
              <SelectContent>
                {sessions.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state?.fieldErrors?.sessionId && (
              <p className="text-sm text-destructive">{state.fieldErrors.sessionId[0]}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t pt-6">
          <Button variant="outline" type="button" onClick={() => router.push("/dashboard/timetable")} className="mr-2" disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create Timetable"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

