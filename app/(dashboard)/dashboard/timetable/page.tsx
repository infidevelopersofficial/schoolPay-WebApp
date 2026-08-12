import { getTimetables } from "@/lib/dal/timetable"
import { TimetablesTable } from "@/components/timetable/timetables-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function TimetablePage() {
  const timetables = await getTimetables()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Timetables</h1>
          <p className="text-muted-foreground text-sm">
            Manage weekly schedules and periods for classes.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/timetable/new">
            <Plus className="mr-2 h-4 w-4" />
            New Timetable
          </Link>
        </Button>
      </div>
      
      <TimetablesTable data={timetables} />
    </div>
  )
}
