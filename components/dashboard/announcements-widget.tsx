import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface DashboardAnnouncement {
  id: string
  title: string
  date: string
  priority: string
}

interface AnnouncementsWidgetProps {
  announcements: DashboardAnnouncement[]
}

const PRIORITY_DOT: Record<string, string> = {
  URGENT: "bg-red-500",
  HIGH: "bg-orange-400",
  MEDIUM: "bg-yellow-400",
  LOW: "bg-gray-300",
}

export function AnnouncementsWidget({ announcements }: AnnouncementsWidgetProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Announcements</CardTitle>
        <Link href="/announcements" className="text-sm text-primary hover:underline">
          View All
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {announcements.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No active announcements</p>
        ) : (
          announcements.map((a) => (
            <div
              key={a.id}
              className="flex items-start justify-between border-b border-border pb-3 last:border-0 last:pb-0 gap-2"
            >
              <div className="flex items-start gap-2 min-w-0">
                <span
                  className={cn(
                    "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                    PRIORITY_DOT[a.priority] ?? "bg-gray-300",
                  )}
                />
                <p className="text-sm text-foreground leading-snug">{a.title}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{a.date}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
