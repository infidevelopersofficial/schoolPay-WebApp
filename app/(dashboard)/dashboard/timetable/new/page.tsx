import { getClasses } from "@/lib/dal/classes"
import { getAcademicSessions } from "@/lib/dal/core"
import { CreateTimetableForm } from "@/components/timetable/create-timetable-form"

export const metadata = { title: "New Timetable | SchoolPay" }

export default async function NewTimetablePage() {
  const [classes, sessions] = await Promise.all([
    getClasses(),
    getAcademicSessions()
  ])

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Create Timetable</h1>
        <p className="text-sm text-muted-foreground">Define a new weekly timetable for a specific class and session.</p>
      </div>

      <CreateTimetableForm classes={classes} sessions={sessions} />
    </div>
  )
}
