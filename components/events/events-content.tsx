"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, MoreHorizontal } from "lucide-react"

interface Event {
  id: string
  name: string
  date: string
  time?: string | null
  location: string
  type: string
  status: string
  description?: string | null
}

const getTypeBadge = (type: string) => {
  const t = type.toUpperCase()
  const colors: Record<string, string> = {
    MEETING: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    SPORTS: "bg-green-100 text-green-700 hover:bg-green-100",
    ACADEMIC: "bg-purple-100 text-purple-700 hover:bg-purple-100",
    CULTURAL: "bg-pink-100 text-pink-700 hover:bg-pink-100",
    HOLIDAY: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  }
  return <Badge className={colors[t] || ""}>{type}</Badge>
}

const getStatusBadge = (status: string) => {
  switch (status.toUpperCase()) {
    case "UPCOMING": return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Upcoming</Badge>
    case "COMPLETED": return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Completed</Badge>
    case "CANCELLED": return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Cancelled</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
}

export function EventsContent({ events }: { events: Event[] }) {
  if (events.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h3 className="mt-4 text-lg font-semibold">No events scheduled</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            You don't have any upcoming events. Click 'Create Event' to add one.
          </p>
        </div>
      </div>
    )
  }

  return (
    <Tabs defaultValue="all" className="space-y-4">
      <TabsList>
        <TabsTrigger value="all">All Events</TabsTrigger>
        <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        <TabsTrigger value="past">Past Events</TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="upcoming" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.filter((event) => event.status.toUpperCase() === "UPCOMING").map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="past" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.filter((event) => event.status.toUpperCase() === "COMPLETED").map((event) => (
            <EventCard key={event.id} event={event} className="opacity-75" />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  )
}

function EventCard({ event, className = "" }: { event: Event; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg">{event.name}</CardTitle>
            <div className="flex items-center gap-2">
              {getTypeBadge(event.type)}
              {getStatusBadge(event.status)}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Details</DropdownMenuItem>
              <DropdownMenuItem>Edit Event</DropdownMenuItem>
              <DropdownMenuItem>Share</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">Cancel Event</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{event.description || "No description provided."}</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{event.time || "All day"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{event.location}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
