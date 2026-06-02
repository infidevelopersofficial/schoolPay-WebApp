"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Inbox, Send, Archive, Trash2, Star, MoreHorizontal, Paperclip } from "lucide-react"

interface Message {
  id: string
  from: string
  fromEmail: string
  to: string
  toEmail: string
  subject: string
  body: string
  createdAt: Date
  unread: boolean
  starred: boolean
  hasAttachment: boolean
}

export function MessagesContent({ messages, currentUserEmail }: { messages: Message[], currentUserEmail: string }) {
  const inboxMessages = messages.filter(m => m.toEmail === currentUserEmail)
  const sentMessages = messages.filter(m => m.fromEmail === currentUserEmail)
  const starredMessages = messages.filter(m => m.starred)
  const archivedMessages: Message[] = [] // Not supported in DB yet

  const renderMessageList = (msgList: Message[], emptyText: string) => {
    if (msgList.length === 0) {
      return (
        <div className="flex items-center justify-center h-40 text-muted-foreground border border-dashed rounded-md">
          {emptyText}
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {msgList.map((msg) => (
          <Card key={msg.id} className={msg.unread ? "border-l-4 border-l-primary" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{msg.from.split(" ").map((n) => n[0]).join("").substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium truncate ${msg.unread ? "font-bold" : ""}`}>{msg.from}</p>
                        {msg.unread && <Badge variant="default" className="h-5 px-1.5 text-xs">New</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{msg.fromEmail}</p>
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
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{msg.body}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-muted-foreground">{new Date(msg.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <Tabs defaultValue="inbox" className="space-y-4">
      <TabsList>
        <TabsTrigger value="inbox" className="gap-2"><Inbox className="h-4 w-4" />Inbox</TabsTrigger>
        <TabsTrigger value="sent" className="gap-2"><Send className="h-4 w-4" />Sent</TabsTrigger>
        <TabsTrigger value="starred" className="gap-2"><Star className="h-4 w-4" />Starred</TabsTrigger>
        <TabsTrigger value="archive" className="gap-2"><Archive className="h-4 w-4" />Archive</TabsTrigger>
      </TabsList>

      <TabsContent value="inbox" className="space-y-2">
        {renderMessageList(inboxMessages, "No new messages")}
      </TabsContent>

      <TabsContent value="sent" className="space-y-2">
        {renderMessageList(sentMessages, "No sent messages")}
      </TabsContent>

      <TabsContent value="starred" className="space-y-2">
        {renderMessageList(starredMessages, "No starred messages")}
      </TabsContent>

      <TabsContent value="archive" className="space-y-2">
        {renderMessageList(archivedMessages, "No archived messages")}
      </TabsContent>
    </Tabs>
  )
}
