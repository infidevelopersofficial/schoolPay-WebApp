import { getSchoolAnnouncements } from "@/lib/dal/parent-portal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, Info, AlertTriangle, Megaphone, CalendarDays } from "lucide-react"

export const metadata = {
  title: "Announcements — Parent Portal",
}

const PRIORITY_CONFIG = {
  LOW: { label: "Info", icon: Info, color: "bg-slate-100 text-slate-600 border-slate-200" },
  MEDIUM: { label: "Medium", icon: Bell, color: "bg-blue-100 text-blue-700 border-blue-200" },
  HIGH: { label: "High", icon: Megaphone, color: "bg-amber-100 text-amber-700 border-amber-200" },
  URGENT: { label: "Urgent", icon: AlertTriangle, color: "bg-red-100 text-red-700 border-red-200" },
} as const

const CATEGORY_CONFIG: Record<string, string> = {
  GENERAL: "General",
  ACADEMIC: "Academic",
  EVENT: "Event",
  HOLIDAY: "Holiday",
  EXAM: "Exam",
  FEE: "Fee",
}

export default async function ParentAnnouncementsPage() {
  const announcements = await getSchoolAnnouncements()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Announcements</h1>
        <p className="text-slate-500 mt-1 text-sm">Latest updates from the school</p>
      </div>

      {announcements.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Bell className="h-10 w-10 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-400 text-sm">No announcements at this time</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => {
            const cfg = PRIORITY_CONFIG[ann.priority as keyof typeof PRIORITY_CONFIG]
            const Icon = cfg?.icon ?? Bell
            return (
              <Card key={ann.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-lg ${cfg?.color ?? ""}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                        {ann.title}
                      </CardTitle>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Badge variant="outline" className="text-xs">
                        {CATEGORY_CONFIG[ann.category] ?? ann.category}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {ann.content}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {new Date(ann.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </span>
                    <span>By {ann.author}</span>
                    {ann.expiryDate && (
                      <span className="text-amber-500">Expires {ann.expiryDate}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
