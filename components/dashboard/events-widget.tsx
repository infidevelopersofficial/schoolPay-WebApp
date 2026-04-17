import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface DashboardEvent {
  id: string
  name: string
  date: string
  time: string | null
  description: string | null
  type: string
}

interface EventsWidgetProps {
  events: DashboardEvent[]
}

const TYPE_BORDER: Record<string, string> = {
  MEETING: "border-l-primary",
  SPORTS: "border-l-blue-400",
  ACADEMIC: "border-l-yellow-400",
  CULTURAL: "border-l-green-400",
  HOLIDAY: "border-l-red-400",
  OTHER: "border-l-muted-foreground",
}

export function EventsWidget({ events }: EventsWidgetProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Upcoming Events</CardTitle>
        <Link href="/events" className="text-sm text-primary hover:underline">
          View All
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No upcoming events</p>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className={cn("border-l-4 pl-3 py-2", TYPE_BORDER[event.type] ?? "border-l-border")}
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-medium text-foreground leading-tight">{event.name}</h4>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{event.date}</span>
              </div>
              {event.time && (
                <p className="mt-0.5 text-xs text-muted-foreground">{event.time}</p>
              )}
              {event.description && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{event.description}</p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
