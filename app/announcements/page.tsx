import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter, Megaphone, Pin } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const announcements = [
  {
    id: 1,
    title: "Fee Structure Updated for 2025-26",
    content:
      "The fee structure for the upcoming academic year 2025-26 has been updated. Please check the Fees section for detailed breakdown. Early bird discount available until March 31st.",
    author: "Finance Department",
    date: "2025-01-01",
    priority: "high",
    pinned: true,
    category: "Finance",
  },
  {
    id: 2,
    title: "Online Payment Portal Maintenance",
    content:
      "The online payment portal will be under maintenance on January 10th from 2:00 AM to 6:00 AM. Please plan your payments accordingly.",
    author: "IT Department",
    date: "2025-01-05",
    priority: "medium",
    pinned: true,
    category: "System",
  },
  {
    id: 3,
    title: "Scholarship Applications Open",
    content:
      "Merit-based scholarship applications for the academic year 2025-26 are now open. Eligible students can apply through the student portal before February 28th.",
    author: "Admin Office",
    date: "2025-01-10",
    priority: "high",
    pinned: false,
    category: "Academic",
  },
  {
    id: 4,
    title: "Parent-Teacher Meeting Schedule",
    content:
      "The quarterly parent-teacher meeting is scheduled for January 25th. Time slots can be booked through the parent portal starting January 15th.",
    author: "Academic Office",
    date: "2025-01-12",
    priority: "medium",
    pinned: false,
    category: "Events",
  },
  {
    id: 5,
    title: "Sports Day Registration",
    content:
      "Registration for the Annual Sports Day events is now open. Students can register for their preferred events through their class teachers.",
    author: "Sports Department",
    date: "2025-01-14",
    priority: "low",
    pinned: false,
    category: "Events",
  },
  {
    id: 6,
    title: "Library Late Fee Waiver",
    content:
      "A one-time late fee waiver is being offered for all overdue library books returned before January 20th. Take advantage of this opportunity!",
    author: "Library",
    date: "2025-01-15",
    priority: "low",
    pinned: false,
    category: "Finance",
  },
]

const priorityColors = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
}

const categoryColors = {
  Finance: "bg-blue-100 text-blue-700",
  System: "bg-purple-100 text-purple-700",
  Academic: "bg-green-100 text-green-700",
  Events: "bg-orange-100 text-orange-700",
}

export default function AnnouncementsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Announcements</h1>
            <p className="text-sm text-muted-foreground">School-wide announcements and notifications</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Announcement
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search announcements..." className="pl-10" />
          </div>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className={announcement.pinned ? "border-primary/50 bg-primary/5" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Megaphone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{announcement.title}</CardTitle>
                        {announcement.pinned && <Pin className="h-4 w-4 text-primary fill-primary" />}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={priorityColors[announcement.priority as keyof typeof priorityColors]}>
                          {announcement.priority}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={categoryColors[announcement.category as keyof typeof categoryColors]}
                        >
                          {announcement.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{announcement.date}</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{announcement.content}</p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {announcement.author
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">Posted by {announcement.author}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
