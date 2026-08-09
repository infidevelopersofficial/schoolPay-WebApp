"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter, Calendar, User, AlertCircle, Bell, Edit } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NewAnnouncementForm } from "@/components/forms"
import { DeleteAnnouncementButton } from "./delete-announcement-button"
import Link from "next/link"

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

export function AnnouncementsClient({ initialData }: { initialData: any[] }) {
  const [showNewForm, setShowNewForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const filtered = initialData.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
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

      <NewAnnouncementForm 
        open={showNewForm} 
        onOpenChange={setShowNewForm} 
        onSuccess={() => setShowNewForm(false)} 
      />

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search announcements..." 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((announcement) => (
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
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/announcements/${announcement.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </Button>
                  <DeleteAnnouncementButton id={announcement.id} />
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
        {filtered.length === 0 && (
          <p className="text-muted-foreground">No active announcements found.</p>
        )}
      </div>
    </div>
  )
}
