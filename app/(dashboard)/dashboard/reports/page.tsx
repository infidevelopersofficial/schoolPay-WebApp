import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ReportGenerator } from "@/components/reports/report-generator"
import { getFeeCollectionReport, getOutstandingFeesReport } from "./actions"
import { getTenantContext } from "@/lib/tenant-context"
import { prisma as db } from "@/lib/prisma"

export default async function ReportsPage() {
  const { schoolId } = await getTenantContext()
  const tenant = await db.school.findUnique({ where: { id: schoolId } })
  const schoolName = tenant?.name || "School";

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reports</h1>
            <p className="text-sm text-muted-foreground">View and download financial and attendance reports</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Input placeholder="Search reports..." className="pl-10" />
          </div>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        <Tabs defaultValue="available" className="space-y-4">
          <TabsList>
            <TabsTrigger value="available">Available Reports</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="available" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Fee Collection Report */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Fee Collection Report</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">Summary of collected fees</p>
                  <div className="flex gap-2">
                    <ReportGenerator 
                      schoolName={schoolName}
                      schoolLogo={tenant?.logoUrl}
                      reportName="Fee Collection Report"
                      description="Summary of collected fees"
                      fetchData={getFeeCollectionReport}
                      columns={[
                        { header: "Receipt No", key: "receiptNumber" },
                        { header: "Student Name", key: "studentName" },
                        { header: "Admission No", key: "admissionNumber" },
                        { header: "Date", key: "date" },
                        { header: "Type", key: "feeType" },
                        { header: "Method", key: "paymentMethod" },
                        { header: "Amount", key: "amount" }
                      ]}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Outstanding Fees Report */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Outstanding Fees Report</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">List of students with pending fees</p>
                  <div className="flex gap-2">
                    <ReportGenerator 
                      schoolName={schoolName}
                      schoolLogo={tenant?.logoUrl}
                      reportName="Outstanding Fees Report"
                      description="List of students with pending fees"
                      fetchData={getOutstandingFeesReport}
                      columns={[
                        { header: "Student Name", key: "studentName" },
                        { header: "Admission No", key: "admissionNumber" },
                        { header: "Class", key: "class" },
                        { header: "Phone", key: "phone" },
                        { header: "Total Fees", key: "totalFees" },
                        { header: "Paid", key: "paidAmount" },
                        { header: "Pending", key: "pendingAmount" }
                      ]}
                    />
                  </div>
                </CardContent>
              </Card>

            </div>
          </TabsContent>

          <TabsContent value="scheduled">
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              No scheduled reports. Configure automated reports in settings.
            </div>
          </TabsContent>
        </Tabs>
      </div>
  )
}
