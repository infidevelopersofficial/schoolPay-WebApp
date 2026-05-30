import { ClassesTable } from "@/components/classes/classes-table"
import { ClassesPageClient } from "@/components/classes/classes-page-client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter, Download } from "lucide-react"
import { getClasses } from "@/lib/dal/classes"

export const metadata = { title: "Classes | SchoolPay" }

export default async function ClassesPage() {
  const classes = await getClasses()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Classes</h1>
          <p className="text-sm text-muted-foreground">Manage class sections and assignments</p>
        </div>
        <ClassesPageClient />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search classes..." className="pl-10" />
        </div>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <ClassesTable data={classes} />
    </div>
  )
}
