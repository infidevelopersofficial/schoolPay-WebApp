import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const messages = [
  { id: 1, from: "Ms. Sarah Anderson", subject: "Regarding Assignment Submission", time: "2 hrs ago", unread: true },
  { id: 2, from: "Principal Office", subject: "School Holiday Announcement", time: "5 hrs ago", unread: true },
  { id: 3, from: "Dr. James Wilson", subject: "Math Quiz Results", time: "1 day ago", unread: false },
  { id: 4, from: "Event Committee", subject: "Sports Day Participation", time: "2 days ago", unread: false },
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
            New Message
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search messages..." className="pl-10" />
          </div>
        </div>

        <div className="space-y-2">
          {messages.map((msg) => (
            <Card key={msg.id} className={msg.unread ? "bg-muted/50" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {msg.from
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{msg.from}</p>
                      <p className="text-sm text-muted-foreground">{msg.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">{msg.time}</span>
                    {msg.unread && <Badge>New</Badge>}
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
