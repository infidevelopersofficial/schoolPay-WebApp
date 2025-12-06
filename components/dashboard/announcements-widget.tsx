import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

const announcements = [
  {
    id: 1,
    title: "Fee structure updated for 2025-26",
    date: "2025-01-01",
  },
  {
    id: 2,
    title: "Online payment portal maintenance",
    date: "2025-01-05",
  },
  {
    id: 3,
    title: "Scholarship applications open",
    date: "2025-01-10",
  },
]

export function AnnouncementsWidget() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Announcements</CardTitle>
        <Link href="/announcements" className="text-sm text-primary hover:underline">
          View All
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className="flex items-start justify-between border-b border-border pb-3 last:border-0 last:pb-0"
          >
            <p className="text-sm text-foreground">{announcement.title}</p>
            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{announcement.date}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
