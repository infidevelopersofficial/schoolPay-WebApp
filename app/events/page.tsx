import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const events = [
  { id: 1, name: "Parent-Teacher Meeting", date: "2025-01-20", type: "Meeting", description: "Quarterly PTM" },
  { id: 2, name: "Sports Day", date: "2025-02-15", type: "Sports", description: "Annual sports competition" },
  { id: 3, name: "Science Exhibition", date: "2025-03-10", type: "Academic", description: "Student science projects" },
  {
    id: 4,
    name: "Annual Concert",
    date: "2025-04-05",
    type: "Cultural",
    description: "School music and dance festival",
  },
]

export default function EventsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Events</h1>
            <p className="text-sm text-muted-foreground">School events and activities</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Event
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search events..." className="pl-10" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{event.name}</CardTitle>
                  <Badge variant="outline">{event.type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Date:</span> {event.date}
                </p>
                <p>
                  <span className="text-muted-foreground">Description:</span> {event.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
