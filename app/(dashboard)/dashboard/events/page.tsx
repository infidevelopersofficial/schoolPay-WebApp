import { Suspense } from "react"
import { getEvents } from "@/lib/dal/events"
import { EventsContent } from "@/components/events/events-content"
import { EventsPageClient } from "@/components/events/events-page-client"
import { Button } from "@/components/ui/button"
import { Filter, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { TableSkeleton } from "@/components/ui/table-skeleton"

export const metadata = { title: "Events | SchoolPay" }

export default async function EventsPage(props: {
  searchParams?: Promise<{ query?: string }>
}) {
  const searchParams = await props.searchParams
  const query = searchParams?.query || ""

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Events</h1>
          <p className="text-sm text-muted-foreground">Manage school events and activities</p>
        </div>
        <EventsPageClient />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search events..." className="pl-10" />
        </div>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>

      <Suspense key={query} fallback={<TableSkeleton />}>
        <EventDataFetcher search={query} />
      </Suspense>
    </div>
  )
}

async function EventDataFetcher({ search }: { search: string }) {
  let events = await getEvents()

  if (search) {
    const lowerSearch = search.toLowerCase()
    events = events.filter(e => 
      e.name.toLowerCase().includes(lowerSearch) || 
      e.location.toLowerCase().includes(lowerSearch) ||
      e.type.toLowerCase().includes(lowerSearch)
    )
  }

  return <EventsContent events={events} />
}
