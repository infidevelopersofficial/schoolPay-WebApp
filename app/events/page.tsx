import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
<<<<<<< HEAD
import { Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const events = [
  { id: 1, name: "Parent-Teacher Meeting", date: "2025-01-20", type: "Meeting", description: "Quarterly PTM" },
  { id: 2, name: "Sports Day", date: "2025-02-15", type: "Sports", description: "Annual sports competition" },
  { id: 3, name: "Science Exhibition", date: "2025-03-10", type: "Academic", description: "Student science projects" },
=======
import { Plus, Search, Filter, Calendar, Clock, MapPin, Users, MoreHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const events = [
  {
    id: 1,
    name: "Parent-Teacher Meeting",
    date: "2025-01-20",
    time: "10:00 AM - 4:00 PM",
    location: "School Auditorium",
    type: "Meeting",
    attendees: 450,
    status: "upcoming",
    description: "Quarterly parent-teacher conference for all grades.",
  },
  {
    id: 2,
    name: "Annual Sports Day",
    date: "2025-02-15",
    time: "08:00 AM - 5:00 PM",
    location: "School Grounds",
    type: "Sports",
    attendees: 1200,
    status: "upcoming",
    description: "Annual inter-house sports competition.",
  },
  {
    id: 3,
    name: "Science Exhibition",
    date: "2025-03-10",
    time: "09:00 AM - 3:00 PM",
    location: "Science Block",
    type: "Academic",
    attendees: 300,
    status: "upcoming",
    description: "Student science project showcase and competition.",
  },
>>>>>>> master
  {
    id: 4,
    name: "Annual Concert",
    date: "2025-04-05",
<<<<<<< HEAD
    type: "Cultural",
    description: "School music and dance festival",
  },
]

=======
    time: "06:00 PM - 9:00 PM",
    location: "School Auditorium",
    type: "Cultural",
    attendees: 800,
    status: "upcoming",
    description: "Annual music and dance festival.",
  },
  {
    id: 5,
    name: "Career Counseling Session",
    date: "2025-01-25",
    time: "02:00 PM - 5:00 PM",
    location: "Conference Hall",
    type: "Academic",
    attendees: 150,
    status: "upcoming",
    description: "Career guidance for senior students.",
  },
  {
    id: 6,
    name: "Winter Break Begins",
    date: "2024-12-20",
    time: "All Day",
    location: "N/A",
    type: "Holiday",
    attendees: 0,
    status: "completed",
    description: "Winter vacation starts.",
  },
  {
    id: 7,
    name: "Fee Payment Deadline",
    date: "2025-01-31",
    time: "All Day",
    location: "N/A",
    type: "Finance",
    attendees: 0,
    status: "upcoming",
    description: "Last date for semester fee submission.",
  },
]

const typeColors: Record<string, string> = {
  Meeting: "bg-blue-100 text-blue-700",
  Sports: "bg-green-100 text-green-700",
  Academic: "bg-purple-100 text-purple-700",
  Cultural: "bg-pink-100 text-pink-700",
  Holiday: "bg-orange-100 text-orange-700",
  Finance: "bg-yellow-100 text-yellow-700",
}

const statusColors = {
  upcoming: "bg-blue-100 text-blue-700",
  ongoing: "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
}

>>>>>>> master
export default function EventsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Events</h1>
<<<<<<< HEAD
            <p className="text-sm text-muted-foreground">School events and activities</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Event
=======
            <p className="text-sm text-muted-foreground">School events and activities calendar</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Event
>>>>>>> master
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search events..." className="pl-10" />
          </div>
<<<<<<< HEAD
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
=======
          <Button variant="outline" className="gap-2 bg-transparent">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="all">All Events</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events
                .filter((e) => e.status === "upcoming")
                .map((event) => (
                  <Card key={event.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{event.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={typeColors[event.type]}>{event.type}</Badge>
                            <Badge
                              variant="outline"
                              className={statusColors[event.status as keyof typeof statusColors]}
                            >
                              {event.status}
                            </Badge>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Cancel Event</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{event.location}</span>
                        </div>
                        {event.attendees > 0 && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{event.attendees} expected attendees</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => (
                <Card key={event.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{event.name}</CardTitle>
                      <Badge className={typeColors[event.type]}>{event.type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{event.location}</span>
                    </div>
                    <Badge variant="outline" className={statusColors[event.status as keyof typeof statusColors]}>
                      {event.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="calendar">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>Calendar view coming soon</p>
                    <p className="text-sm">Interactive calendar with drag and drop scheduling</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
>>>>>>> master
      </div>
    </DashboardLayout>
  )
}
