"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter, Calendar, User, AlertCircle, Bell } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NewAnnouncementForm } from "@/components/forms"

const announcements = [
  { id: 1, title: "School Reopening After Winter Break", content: "School will reopen on January 5th, 2025. All students are expected to attend classes from 8:00 AM onwards.", date: "2024-12-15", author: "Principal", priority: "high", category: "General", targetAudience: "All" },
  { id: 2, title: "Final Exam Schedule Released", content: "The final examination schedule for all grades has been published. Please check the notice board and school website for details.", date: "2024-12-10", author: "Academic Head", priority: "urgent", category: "Exam", targetAudience: "Students" },
  { id: 3, title: "Fee Payment Deadline Extended", content: "Due to multiple requests, the fee payment deadline has been extended to January 15th, 2025.", date: "2024-12-08", author: "Accounts Department", priority: "medium", category: "Fee", targetAudience: "Parents" },
  { id: 4, title: "Sports Day Registrations Open", content: "Registrations for the Annual Sports Day are now open. Students interested in participating should register by January 10th.", date: "2024-12-05", author: "Sports Coordinator", priority: "low", category: "Event", targetAudience: "Students" },
  { id: 5, title: "Parent-Teacher Meeting Scheduled", content: "The quarterly parent-teacher meeting is scheduled for January 20th, 2025. All parents are requested to attend.", date: "2024-12-01", author: "Admin Office", priority: "high", category: "Event", targetAudience: "Parents" },
]

const getPriorityBadge = (priority: string) => {
  const colors: Record<string, string> = {
    urgent: "bg-red-100 text-red-700 hover:bg-red-100",
    high: "bg-orange-100 text-orange-700 hover:bg-orange-100",
    medium: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
    low: "bg-green-100 text-green-700 hover:bg-green-100",
  }
  return <Badge className={colors[priority] || ""}>{priority.toUpperCase()}</Badge>
}

const getCategoryBadge = (category: string) => {
  const colors: Record<string, string> = {
    General: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    Academic: "bg-purple-100 text-purple-700 hover:bg-purple-100",
    Event: "bg-pink-100 text-pink-700 hover:bg-pink-100",
    Holiday: "bg-green-100 text-green-700 hover:bg-green-100",
    Exam: "bg-orange-100 text-orange-700 hover:bg-orange-100",
    Fee: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  }
  return <Badge variant="outline" className={colors[category] || ""}>{category}</Badge>
}

export default function AnnouncementsPage() {
  const [showNewForm, setShowNewForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Announcements</h1>
            <p className="text-sm text-muted-foreground">School-wide announcements and notices</p>
          </div>
          <Button className="gap-2" onClick={() => setShowNewForm(true)}>
            <Plus className="h-4 w-4" />
            New Announcement
          </Button>
        </div>

        <NewAnnouncementForm open={showNewForm} onOpenChange={setShowNewForm} onSuccess={() => setRefreshKey(prev => prev + 1)} />

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search announcements..." className="pl-10" />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="academic">Academic</SelectItem>
              <SelectItem value="event">Event</SelectItem>
              <SelectItem value="exam">Exam</SelectItem>
              <SelectItem value="fee">Fee</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all-priority">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-priority">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        <div className="space-y-4" key={refreshKey}>
          {announcements.map((announcement) => (
            <Card key={announcement.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {announcement.priority === "urgent" && (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      {announcement.priority === "high" && (
                        <Bell className="h-5 w-5 text-orange-600" />
                      )}
                      <CardTitle className="text-xl">{announcement.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {getPriorityBadge(announcement.priority)}
                      {getCategoryBadge(announcement.category)}
                      <Badge variant="secondary">{announcement.targetAudience}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{announcement.content}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{announcement.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{announcement.author}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
