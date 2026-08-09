import { notFound } from "next/navigation"
import { getFeeStructureDetail } from "@/lib/dal/fee-structure"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, IndianRupee, CheckCircle2, Clock, AlertCircle } from "lucide-react"

export default async function FeeStructureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const structure = await getFeeStructureDetail(id)
  
  if (!structure) {
    notFound()
  }

  const { metrics, items, mappings } = structure

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{structure.name}</h2>
          <p className="text-muted-foreground">{structure.description || "No description provided."}</p>
        </div>
        <Badge variant={structure.isActive ? "default" : "secondary"}>
          {structure.isActive ? "Active" : "Archived"}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Items</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalAssigned}</div>
            <p className="text-xs text-muted-foreground">Mapped across {mappings.length} classes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expected</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{metrics.totalExpected.toLocaleString("en-IN")}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{metrics.totalCollected.toLocaleString("en-IN")}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalExpected > 0 ? Math.round((metrics.totalCollected / metrics.totalExpected) * 100) : 0}% collected
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Status</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center text-green-600"><CheckCircle2 className="h-3 w-3 mr-1"/> Paid</span>
              <span className="font-medium">{metrics.statusCounts.PAID}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center text-yellow-600"><Clock className="h-3 w-3 mr-1"/> Pending/Partial</span>
              <span className="font-medium">{metrics.statusCounts.PENDING + metrics.statusCounts.PARTIAL}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center text-red-600"><AlertCircle className="h-3 w-3 mr-1"/> Overdue</span>
              <span className="font-medium">{metrics.statusCounts.OVERDUE}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fee Items</CardTitle>
            <CardDescription>Line items that make up this fee structure.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center">No items found</TableCell></TableRow>
                ) : (
                  items.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell><Badge variant="outline">{item.frequency}</Badge></TableCell>
                      <TableCell className="text-right">₹{item.amount.toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mapped Classes</CardTitle>
            <CardDescription>Classes assigned to this fee structure.</CardDescription>
          </CardHeader>
          <CardContent>
            {mappings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No classes mapped.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {mappings.map(m => (
                  <Badge key={m.id} variant="secondary" className="px-3 py-1">
                    {m.class.name} {m.class.section}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
