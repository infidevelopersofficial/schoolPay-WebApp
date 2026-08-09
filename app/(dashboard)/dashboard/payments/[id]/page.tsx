import { notFound } from "next/navigation"
import { getPaymentById } from "@/lib/dal/payments"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default async function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payment = await getPaymentById(id)

  if (!payment) {
    notFound()
  }

  const statusColors = {
    COMPLETED: "bg-green-100 text-green-700 hover:bg-green-100",
    PENDING: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
    FAILED: "bg-red-100 text-red-700 hover:bg-red-100",
    REFUNDED: "bg-gray-100 text-gray-700 hover:bg-gray-100",
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payment Details</h2>
          <p className="text-muted-foreground">
            Receipt: {payment.receiptNumber || payment.id.slice(0, 8)}
          </p>
        </div>
        <Badge className={statusColors[payment.status as keyof typeof statusColors] || "bg-secondary"}>
          {payment.status}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-7 lg:grid-cols-7 h-[600px]">
        {/* Left Col: Metadata */}
        <Card className="md:col-span-3 overflow-y-auto">
          <CardHeader>
            <CardTitle>Transaction Summary</CardTitle>
            <CardDescription>Details of the recorded payment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Student</h3>
              <p className="text-base font-medium">{payment.student.name}</p>
              <p className="text-sm text-muted-foreground">
                Class {payment.student.class} {payment.student.section ? `- ${payment.student.section}` : ""}
                {payment.student.studentId ? ` | ID: ${payment.student.studentId}` : ""}
              </p>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Amount Paid</h3>
                <p className="text-2xl font-bold text-green-600">
                  ₹{payment.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Payment Date</h3>
                <p className="text-base font-medium">
                  {new Date(payment.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Fee Type</h3>
                <p className="text-sm font-medium">{payment.feeType}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Payment Method</h3>
                <Badge variant="outline">{payment.paymentMethod}</Badge>
              </div>
            </div>

            {payment.transactionId && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Transaction ID / Reference</h3>
                  <p className="text-sm font-mono bg-muted p-2 rounded-md break-all">{payment.transactionId}</p>
                </div>
              </>
            )}

            {payment.remarks && (
              <>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Remarks</h3>
                  <p className="text-sm">{payment.remarks}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Right Col: PDF Iframe */}
        <Card className="md:col-span-4 flex flex-col h-full">
          <CardHeader className="py-4 border-b">
            <CardTitle>Receipt Document</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <iframe 
              src={`/api/receipts/${payment.id}`} 
              className="w-full h-full rounded-b-lg border-0"
              title={`Receipt ${payment.receiptNumber || payment.id}`}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
