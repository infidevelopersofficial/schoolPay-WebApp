"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, Inbox, Send, Archive, Trash2, Star, MoreHorizontal, Paperclip } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ComposeMessageForm } from "@/components/forms"

const messages = [
  { id: 1, from: "Ms. Sarah Anderson", email: "sarah.a@school.edu", avatar: "/placeholder.svg?height=40&width=40", subject: "Regarding Fee Payment Extension", preview: "Dear Admin, I would like to request an extension for John's tuition fee payment...", time: "2 hours ago", unread: true, starred: false, hasAttachment: false },
  { id: 2, from: "Principal's Office", email: "principal@school.edu", avatar: "/placeholder.svg?height=40&width=40", subject: "School Holiday Announcement", preview: "Please be informed that the school will remain closed on January 26th for Republic Day...", time: "5 hours ago", unread: true, starred: true, hasAttachment: true },
  { id: 3, from: "Dr. James Wilson", email: "james.w@school.edu", avatar: "/placeholder.svg?height=40&width=40", subject: "Math Quiz Results", preview: "The results for the recent mathematics quiz have been uploaded to the system...", time: "1 day ago", unread: false, starred: false, hasAttachment: false },
  { id: 4, from: "Event Committee", email: "events@school.edu", avatar: "/placeholder.svg?height=40&width=40", subject: "Sports Day Participation", preview: "We are excited to announce the upcoming Annual Sports Day. Please confirm participation...", time: "2 days ago", unread: false, starred: true, hasAttachment: true },
  { id: 5, from: "Parent Association", email: "parents@school.edu", avatar: "/placeholder.svg?height=40&width=40", subject: "Monthly Meeting Invitation", preview: "You are cordially invited to attend the monthly parent-teacher association meeting...", time: "3 days ago", unread: false, starred: false, hasAttachment: false },
]

export default function MessagesPage() {
  const [showComposeForm, setShowComposeForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Messages</h1>
            <p className="text-sm text-muted-foreground">Internal communication and announcements</p>
          </div>
          <Button className="gap-2" onClick={() => setShowComposeForm(true)}>
            <Plus className="h-4 w-4" />
            Compose
          </Button>
        </div>

        <ComposeMessageForm open={showComposeForm} onOpenChange={setShowComposeForm} onSuccess={() => setRefreshKey(prev => prev + 1)} />

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search messages..." className="pl-10" />
        </div>

        <Tabs defaultValue="inbox" className="space-y-4" key={refreshKey}>
          <TabsList>
            <TabsTrigger value="inbox" className="gap-2"><Inbox className="h-4 w-4" />Inbox</TabsTrigger>
            <TabsTrigger value="sent" className="gap-2"><Send className="h-4 w-4" />Sent</TabsTrigger>
            <TabsTrigger value="starred" className="gap-2"><Star className="h-4 w-4" />Starred</TabsTrigger>
            <TabsTrigger value="archive" className="gap-2"><Archive className="h-4 w-4" />Archive</TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="space-y-2">
            {messages.map((msg) => (
              <Card key={msg.id} className={msg.unread ? "border-l-4 border-l-primary" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={msg.avatar} alt={msg.from} />
                      <AvatarFallback>{msg.from.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`font-medium truncate ${msg.unread ? "font-bold" : ""}`}>{msg.from}</p>
                            {msg.unread && <Badge variant="default" className="h-5 px-1.5 text-xs">New</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{msg.email}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Star className={`h-4 w-4 ${msg.starred ? "fill-yellow-400 text-yellow-400" : ""}`} />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem><Archive className="mr-2 h-4 w-4" />Archive</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <p className={`text-sm mt-2 ${msg.unread ? "font-semibold" : ""}`}>{msg.subject}</p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{msg.preview}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-muted-foreground">{msg.time}</span>
                        {msg.hasAttachment && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Paperclip className="h-3 w-3" />
                            Attachment
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="sent">
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              No sent messages
            </div>
          </TabsContent>

          <TabsContent value="starred">
            <div className="space-y-2">
              {messages.filter((m) => m.starred).map((msg) => (
                <Card key={msg.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={msg.avatar} alt={msg.from} />
                        <AvatarFallback>{msg.from.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{msg.from}</p>
                            <p className="text-xs text-muted-foreground">{msg.email}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">{msg.time}</span>
                        </div>
                        <p className="text-sm font-semibold mt-2">{msg.subject}</p>
                        <p className="text-sm text-muted-foreground mt-1">{msg.preview}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="archive">
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              No archived messages
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
