import { notFound } from "next/navigation"
import { getTimetableById } from "@/lib/dal/timetable"
import { getSubjects } from "@/lib/dal/subjects"
import { getTeachers } from "@/lib/dal/teachers"
import { TimetableGrid } from "@/components/timetable/timetable-grid"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function TimetableDetailPage({
  params,
}: {
  params: Promise<{ timetableId: string }>
}) {
  const { timetableId } = await params

  const [timetable, subjects, { teachers }] = await Promise.all([
    getTimetableById(timetableId),
    getSubjects(),
    // We use a ceiling of 200 for teacher limits because using AsyncCombobox 
    // inside a shadcn Dialog often causes z-index and focus trapping issues.
    // 200 is a safe ceiling for the vast majority of K-12 schools.
    getTeachers({ limit: 200 })
  ])

  if (!timetable) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/timetable">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Timetable: {timetable.class.name} {timetable.class.section}
          </h1>
          <p className="text-muted-foreground text-sm">
            {timetable.session.name}
          </p>
        </div>
      </div>
      
      <TimetableGrid 
        timetable={timetable} 
        subjects={subjects} 
        teachers={teachers} 
      />
    </div>
  )
}
