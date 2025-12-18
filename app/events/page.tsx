"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter, Calendar, Clock, MapPin, Users, MoreHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CreateEventForm } from "@/components/forms"

const events = [
  { id: 1, name: "Parent-Teacher Meeting", date: "2025-01-20", time: "10:00 AM - 4:00 PM", location: "School Auditorium", type: "Meeting", attendees: 450, status: "upcoming", description: "Quarterly parent-teacher conference for all grades." },
  { id: 2, name: "Annual Sports Day", date: "2025-02-15", time: "08:00 AM - 5:00 PM", location: "School Grounds", type: "Sports", attendees: 1200, status: "upcoming", description: "Annual inter-house sports competition." },
  { id: 3, name: "Science Exhibition", date: "2025-03-10", time: "09:00 AM - 3:00 PM", location: "Science Block", type: "Academic", attendees: 300, status: "upcoming", description: "Student science projects showcase." },
  { id: 4, name: "Cultural Festival", date: "2025-03-25", time: "05:00 PM - 9:00 PM", location: "Main Campus", type: "Cultural", attendees: 800, status: "upcoming", description: "Annual cultural celebration with performances." },
  { id: 5, name: "Winter Break Begins", date: "2024-12-20", time: "All Day", location: "N/A", type: "Holiday", attendees: 0, status: "completed", description: "School closes for winter vacation." },
]

const getTypeBadge = (type: string) => {
  const colors: Record<string, string> = {
    Meeting: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    Sports: "bg-green-100 text-green-700 hover:bg-green-100",
    Academic: "bg-purple-100 text-purple-700 hover:bg-purple-100",
    Cultural: "bg-pink-100 text-pink-700 hover:bg-pink-100",
    Holiday: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  }
  return <Badge className={colors[type] || ""}>{type}</Badge>
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "upcoming": return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Upcoming</Badge>
    case "completed": return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Completed</Badge>
    case "cancelled": return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Cancelled</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
}

export default function EventsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Events</h1>
            <p className="text-sm text-muted-foreground">Manage school events and activities</p>
          </div>
          <Button className="gap-2" onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        </div>

        <CreateEventForm open={showCreateForm} onOpenChange={setShowCreateForm} onSuccess={() => setRefreshKey(prev => prev + 1)} />

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

        <Tabs defaultValue="all" className="space-y-4" key={refreshKey}>
          <TabsList>
            <TabsTrigger value="all">All Events</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past Events</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((event) => (
                <Card key={event.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{event.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          {getTypeBadge(event.type)}
                          {getStatusBadge(event.status)}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
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
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{event.location}</span>
                      </div>
                      {event.attendees > 0 && (
                        <div className="flex items-center gap-2 text-sm">
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

          <TabsContent value="upcoming" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.filter((event) => event.status === "upcoming").map((event) => (
                <Card key={event.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{event.name}</CardTitle>
                        <div className="flex items-center gap-2">{getTypeBadge(event.type)}</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{event.time}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.filter((event) => event.status === "completed").map((event) => (
                <Card key={event.id} className="opacity-75">
                  <CardHeader>
                    <CardTitle className="text-lg">{event.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{event.date}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
