import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, Inbox, Send, Archive, Trash2, Star, MoreHorizontal, Paperclip } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const messages = [
  {
    id: 1,
    from: "Ms. Sarah Anderson",
    email: "sarah.a@school.edu",
    avatar: "/placeholder.svg?height=40&width=40",
    subject: "Regarding Fee Payment Extension",
    preview: "Dear Admin, I would like to request an extension for John's tuition fee payment...",
    time: "2 hours ago",
    unread: true,
    starred: false,
    hasAttachment: false,
  },
  {
    id: 2,
    from: "Principal's Office",
    email: "principal@school.edu",
    avatar: "/placeholder.svg?height=40&width=40",
    subject: "School Holiday Announcement",
    preview: "Please be informed that the school will remain closed on January 26th for Republic Day...",
    time: "5 hours ago",
    unread: true,
    starred: true,
    hasAttachment: true,
  },
  {
    id: 3,
    from: "Dr. James Wilson",
    email: "james.w@school.edu",
    avatar: "/placeholder.svg?height=40&width=40",
    subject: "Math Quiz Results Published",
    preview: "The results for the Grade 10 Mathematics quiz have been published. Please review...",
    time: "1 day ago",
    unread: false,
    starred: false,
    hasAttachment: true,
  },
  {
    id: 4,
    from: "Event Committee",
    email: "events@school.edu",
    avatar: "/placeholder.svg?height=40&width=40",
    subject: "Sports Day Participation Form",
    preview: "Please find attached the participation form for the upcoming Annual Sports Day...",
    time: "2 days ago",
    unread: false,
    starred: true,
    hasAttachment: true,
  },
  {
    id: 5,
    from: "Mr. Robert Kumar",
    email: "robert.k@school.edu",
    avatar: "/placeholder.svg?height=40&width=40",
    subject: "Science Lab Equipment Request",
    preview: "We need to procure additional microscopes for the biology lab. Please approve...",
    time: "3 days ago",
    unread: false,
    starred: false,
    hasAttachment: false,
  },
  {
    id: 6,
    from: "Finance Department",
    email: "finance@school.edu",
    avatar: "/placeholder.svg?height=40&width=40",
    subject: "Monthly Fee Collection Report",
    preview: "Please find attached the fee collection report for December 2024...",
    time: "4 days ago",
    unread: false,
    starred: false,
    hasAttachment: true,
  },
]

const stats = [
  { label: "Inbox", value: 24, icon: Inbox },
  { label: "Sent", value: 156, icon: Send },
  { label: "Archived", value: 89, icon: Archive },
  { label: "Trash", value: 12, icon: Trash2 },
]

export default function MessagesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Messages</h1>
            <p className="text-sm text-muted-foreground">Communication inbox</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Compose
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <stat.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search messages..." className="pl-10" />
          </div>
        </div>

        <Tabs defaultValue="inbox" className="space-y-4">
          <TabsList>
            <TabsTrigger value="inbox" className="gap-2">
              <Inbox className="h-4 w-4" />
              Inbox
              <Badge variant="secondary" className="ml-1">
                24
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="sent" className="gap-2">
              <Send className="h-4 w-4" />
              Sent
            </TabsTrigger>
            <TabsTrigger value="starred" className="gap-2">
              <Star className="h-4 w-4" />
              Starred
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox">
            <div className="space-y-2">
              {messages.map((msg) => (
                <Card key={msg.id} className={msg.unread ? "bg-primary/5 border-primary/20" : ""}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={msg.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {msg.from
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p
                                className={`font-medium truncate ${msg.unread ? "text-foreground" : "text-muted-foreground"}`}
                              >
                                {msg.from}
                              </p>
                              {msg.starred && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                              {msg.hasAttachment && <Paperclip className="h-4 w-4 text-muted-foreground" />}
                            </div>
                            <p className={`text-sm truncate ${msg.unread ? "font-medium" : ""}`}>{msg.subject}</p>
                            <p className="text-sm text-muted-foreground truncate">{msg.preview}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{msg.time}</span>
                            {msg.unread && <Badge className="bg-primary">New</Badge>}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>Mark as Read</DropdownMenuItem>
                                <DropdownMenuItem>Star</DropdownMenuItem>
                                <DropdownMenuItem>Archive</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sent">
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              <div className="text-center">
                <Send className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p>Sent messages will appear here</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="starred">
            <div className="space-y-2">
              {messages
                .filter((m) => m.starred)
                .map((msg) => (
                  <Card key={msg.id}>
                    <CardContent className="py-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={msg.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {msg.from
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{msg.from}</p>
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          </div>
                          <p className="text-sm font-medium">{msg.subject}</p>
                          <p className="text-sm text-muted-foreground truncate">{msg.preview}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{msg.time}</span>
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
