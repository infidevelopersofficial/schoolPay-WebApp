import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"

const events = [
  {
    id: 1,
    title: "Parent-Teacher Meeting",
    time: "12:00 PM - 2:00 PM",
    description: "Annual parent-teacher conference for all grades.",
    color: "border-l-primary",
  },
  {
    id: 2,
    title: "Fee Payment Deadline",
    time: "12:00 PM - 2:00 PM",
    description: "Last date for semester fee submission.",
    color: "border-l-accent",
  },
  {
    id: 3,
    title: "Sports Day",
    time: "12:00 PM - 2:00 PM",
    description: "Annual sports competition for students.",
    color: "border-l-chart-3",
  },
]

export function EventsWidget() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Events</CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.map((event) => (
          <div key={event.id} className={cn("border-l-4 pl-3 py-2", event.color)}>
            <div className="flex items-start justify-between">
              <h4 className="text-sm font-medium text-foreground">{event.title}</h4>
              <span className="text-xs text-muted-foreground">{event.time}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{event.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ")
}
