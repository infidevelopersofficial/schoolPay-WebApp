"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, IndianRupee, Loader2 } from "lucide-react"
import { createFeePaymentOrder, verifyFeePayment } from "@/app/(parent-portal)/parent/fees/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Invoice {
  id: string
  invoiceNo: string
  total: number
  dueDate: Date | null
  status: string
}

interface InvoicePaymentCardProps {
  invoice: Invoice
  studentName: string
}

export function InvoicePaymentCard({ invoice, studentName }: InvoicePaymentCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    try {
      setLoading(true)

      // 1. Create Order
      const { orderId, amount, currency, keyId, error } = await createFeePaymentOrder(invoice.id)
      
      if (error) {
        toast.error(error)
        setLoading(false)
        return
      }

      // 2. Load Razorpay script if not already loaded
      if (!(window as any).Razorpay) {
        await new Promise((resolve) => {
          const script = document.createElement("script")
          script.src = "https://checkout.razorpay.com/v1/checkout.js"
          script.onload = resolve
          document.body.appendChild(script)
        })
      }

      // 3. Open Razorpay Checkout
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: "SchoolPay",
        description: "Fee Payment for " + studentName,
        order_id: orderId,
        handler: async function (response: any) {
          const result = await verifyFeePayment(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature,
            invoice.id
          )

          if (result.error) {
            toast.error(result.error)
          } else {
            toast.success("Payment successful!")
            router.refresh()
          }
        },
        prefill: {
          name: studentName,
        },
        theme: {
          color: "#6d28d9", // violet-700
        },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.on("payment.failed", function (response: any) {
        toast.error(response.error.description || "Payment failed")
      })
      rzp.open()
    } catch (err: any) {
      toast.error(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-500" />
            {invoice.invoiceNo}
          </CardTitle>
          <Badge
            variant="outline"
            className={
              invoice.status === "PAID"
                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                : "bg-red-100 text-red-700 border-red-200"
            }
          >
            {invoice.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between mt-2">
          <div>
            <p className="text-xs text-slate-500 mb-1">Total Amount</p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
              ₹{invoice.total.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 mb-1">Due Date</p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-IN") : "N/A"}
            </p>
          </div>
        </div>
      </CardContent>
      {invoice.status === "PENDING" && (
        <CardFooter className="pt-2">
          <Button 
            className="w-full bg-violet-600 hover:bg-violet-700" 
            onClick={handlePayment} 
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <IndianRupee className="w-4 h-4 mr-2" />}
            Pay Now
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
