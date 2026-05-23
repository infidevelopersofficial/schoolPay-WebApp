import { getMyAnnouncements } from "@/lib/dal/student-portal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Megaphone, Calendar } from "lucide-react"

export const metadata = {
  title: "Announcements | SchoolPay",
}

export default async function StudentAnnouncementsPage() {
  const announcements = await getMyAnnouncements()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Notices & Announcements</h1>
        <p className="text-muted-foreground">Stay up to date with school activities and notices.</p>
      </div>

      {announcements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <Megaphone className="h-10 w-10 mb-4 opacity-20" />
            <p>No active announcements at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((notice) => (
            <Card key={notice.id} className="overflow-hidden">
              <div className="bg-primary/5 px-6 py-3 border-b flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>Posted by {notice.author}</span>
                </div>
                <Badge variant={notice.priority === "HIGH" ? "destructive" : "secondary"}>
                  {notice.priority}
                </Badge>
              </div>
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">{notice.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-foreground">
                  <p className="whitespace-pre-wrap leading-relaxed">{notice.content}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
