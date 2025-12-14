import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"

const reportTypes = [
  {
    id: 1,
    name: "Fee Collection Report",
    description: "Summary of collected and pending fees",
    lastGenerated: "2025-01-10",
  },
  {
    id: 2,
    name: "Student Fee Status",
    description: "Individual student fee status report",
    lastGenerated: "2025-01-08",
  },
  { id: 3, name: "Payment History", description: "Detailed payment transaction history", lastGenerated: "2025-01-05" },
  {
    id: 4,
    name: "Attendance Report",
    description: "Student and teacher attendance statistics",
    lastGenerated: "2025-01-09",
  },
  {
    id: 5,
    name: "Class-wise Analysis",
    description: "Class-wise fee and attendance analysis",
    lastGenerated: "2025-01-07",
  },
  {
    id: 6,
    name: "Outstanding Fees",
    description: "List of students with outstanding fees",
    lastGenerated: "2025-01-11",
  },
]

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reports</h1>
            <p className="text-sm text-muted-foreground">View and download financial and attendance reports</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Input placeholder="Search reports..." className="pl-10" />
          </div>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="available" className="space-y-4">
          <TabsList>
            <TabsTrigger value="available">Available Reports</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportTypes.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{report.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                    <div className="text-xs text-muted-foreground">Last generated: {report.lastGenerated}</div>
                    <div className="flex gap-2">
                      <Button className="flex-1" size="sm">
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="scheduled">
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              No scheduled reports. Configure automated reports in settings.
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
