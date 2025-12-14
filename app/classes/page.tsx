import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ClassesTable } from "@/components/classes/classes-table"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter, Download } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function ClassesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Classes</h1>
            <p className="text-sm text-muted-foreground">Manage classes and sections</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Class
          </Button>
        </div>

        {/* Filters */}
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

        {/* Classes Table */}
        <ClassesTable />
      </div>
    </DashboardLayout>
  )
}
