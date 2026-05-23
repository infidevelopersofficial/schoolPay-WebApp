import { getMyPayments } from "@/lib/dal/student-portal"
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
  title: "My Payments | SchoolPay",
}

export default async function StudentPaymentsPage() {
  const payments = await getMyPayments()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Payment History</h1>
        <p className="text-muted-foreground">View your payment receipts and transaction history.</p>
      </div>

      {payments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
            <p>No payments have been recorded yet.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell className="font-mono text-xs">{receipt.receiptNumber}</TableCell>
                    <TableCell>{new Date(receipt.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span className="capitalize">{receipt.paymentMethod.toLowerCase().replace('_', ' ')}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400">
                        SUCCESS
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600 dark:text-green-400">
                      ₹{receipt.amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {payments.map((receipt) => (
              <Card key={receipt.id}>
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Receipt</h3>
                      <p className="font-mono text-foreground mt-0.5">
                        {receipt.receiptNumber}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400">
                      SUCCESS
                    </Badge>
                  </div>
                  <div className="flex justify-between items-end border-t pt-3">
                    <div className="text-sm">
                      <p className="text-muted-foreground">Date</p>
                      <p className="font-medium">
                        {new Date(receipt.date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 capitalize">
                        Via {receipt.paymentMethod.toLowerCase().replace('_', ' ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                        ₹{receipt.amount.toLocaleString()}
                      </span>
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
