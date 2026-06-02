import { Suspense } from "react"
import { getLessons } from "@/lib/dal/lessons"
import { LessonsContent } from "@/components/lessons/lessons-content"
import { LessonsPageClient } from "@/components/lessons/lessons-page-client"
import { Button } from "@/components/ui/button"
import { Filter, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { TableSkeleton } from "@/components/ui/table-skeleton"

export const metadata = { title: "Lessons | SchoolPay" }

export default async function LessonsPage(props: {
  searchParams?: Promise<{ query?: string }>
}) {
  const searchParams = await props.searchParams
  const query = searchParams?.query || ""

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lessons</h1>
          <p className="text-sm text-muted-foreground">Manage lesson plans and schedules</p>
        </div>
        <LessonsPageClient />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search lessons..." className="pl-10" />
        </div>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>

      <Suspense key={query} fallback={<TableSkeleton />}>
        <LessonDataFetcher search={query} />
      </Suspense>
    </div>
  )
}

async function LessonDataFetcher({ search }: { search: string }) {
  let lessons = await getLessons()

  if (search) {
    const lowerSearch = search.toLowerCase()
    lessons = lessons.filter(l => 
      l.title.toLowerCase().includes(lowerSearch) || 
      l.subject.toLowerCase().includes(lowerSearch) ||
      l.class.toLowerCase().includes(lowerSearch) ||
      (l.teacher?.name && l.teacher.name.toLowerCase().includes(lowerSearch))
    )
  }

  return <LessonsContent lessons={lessons} />
}
