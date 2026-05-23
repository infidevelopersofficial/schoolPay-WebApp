import { getMyFees } from "@/lib/dal/student-portal"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const metadata = {
  title: "My Fees | SchoolPay",
}

export default async function StudentFeesPage() {
  const fees = await getMyFees()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Fees & Dues</h1>
        <p className="text-muted-foreground">View your generated fee invoices and payment status.</p>
      </div>

      {fees.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
            <p>No fee invoices found.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fees.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono text-xs">{invoice.id.slice(-8).toUpperCase()}</TableCell>
                    <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>School Fees</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          invoice.status === "PAID" ? "default" : 
                          invoice.status === "OVERDUE" ? "destructive" : "secondary"
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      ₹{invoice.total.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {fees.map((invoice) => (
              <Card key={invoice.id} className={invoice.status === "OVERDUE" ? "border-destructive/50" : ""}>
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">School Fees</h3>
                      <p className="text-xs font-mono text-muted-foreground mt-1">
                        #{invoice.id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        invoice.status === "PAID" ? "default" : 
                        invoice.status === "OVERDUE" ? "destructive" : "secondary"
                      }
                    >
                      {invoice.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-end border-t pt-3">
                    <div className="text-sm">
                      <p className="text-muted-foreground">Due Date</p>
                      <p className={invoice.status === "OVERDUE" ? "text-destructive font-medium" : "font-medium"}>
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-foreground">₹{invoice.total.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
