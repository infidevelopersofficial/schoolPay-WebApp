import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { FeeStructureTable } from "@/components/fees/fee-structure-table"
import { FeeStatsCards } from "@/components/fees/fee-stats-cards"
<<<<<<< HEAD
=======
import { DiscountsTable } from "@/components/fees/discounts-table"
import { PenaltiesTable } from "@/components/fees/penalties-table"
>>>>>>> master
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Filter, Download } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function FeesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Fees Management</h1>
            <p className="text-sm text-muted-foreground">Configure and manage fee structures</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Fee Type
          </Button>
        </div>

        {/* Stats Cards */}
        <FeeStatsCards />

        {/* Tabs */}
        <Tabs defaultValue="structure" className="space-y-4">
          <TabsList>
            <TabsTrigger value="structure">Fee Structure</TabsTrigger>
            <TabsTrigger value="discounts">Discounts</TabsTrigger>
            <TabsTrigger value="penalties">Late Penalties</TabsTrigger>
          </TabsList>

          <TabsContent value="structure" className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search fee types..." className="pl-10" />
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

            {/* Fee Structure Table */}
            <FeeStructureTable />
          </TabsContent>

<<<<<<< HEAD
          <TabsContent value="discounts">
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              Discounts management coming soon
            </div>
          </TabsContent>

          <TabsContent value="penalties">
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              Late penalties configuration coming soon
            </div>
=======
          <TabsContent value="discounts" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search discounts..." className="pl-10" />
              </div>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Discount
              </Button>
            </div>
            <DiscountsTable />
          </TabsContent>

          <TabsContent value="penalties" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search penalties..." className="pl-10" />
              </div>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Penalty Rule
              </Button>
            </div>
            <PenaltiesTable />
>>>>>>> master
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
