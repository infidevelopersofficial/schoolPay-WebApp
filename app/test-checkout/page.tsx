"use client"

import { useState } from "react"
import { RazorpayCheckoutButton } from "@/components/payments/RazorpayCheckoutButton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle, ShieldCheck, DollarSign } from "lucide-react"

export default function TestCheckoutPage() {
  const [amountRupees, setAmountRupees] = useState(100) // Default ₹100.00
  const [verificationLog, setVerificationLog] = useState<any | null>(null)
  const [errorLog, setErrorLog] = useState<any | null>(null)

  const amountPaise = Math.max(100, Math.round(amountRupees * 100))

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="border-blue-500 text-blue-400 bg-blue-950/40">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Standard Web Checkout Harness
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-white">Razorpay Integration</h1>
          <p className="text-sm text-slate-400">
            Test full order creation, modal invocation, and HMAC signature verification.
          </p>
        </div>

        <Card className="bg-slate-900 border-slate-800 text-white shadow-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center justify-between">
              <span>Test Fee Payment</span>
              <span className="text-blue-400 text-xl font-bold">₹{amountRupees.toFixed(2)}</span>
            </CardTitle>
            <CardDescription className="text-slate-400">
              Enter test amount in Indian Rupees (₹). Minimum amount is ₹1.00 (100 paise).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-slate-300 text-sm">
                Amount (INR ₹)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 font-semibold">₹</span>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="1"
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(Math.max(1, Number(e.target.value) || 0))}
                  className="pl-8 bg-slate-800/80 border-slate-700 text-white font-medium"
                />
              </div>
              <p className="text-xs text-slate-500">
                Calculated payload amount: <span className="text-slate-300 font-mono">{amountPaise} paise</span>
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Mode:</span>
                <span className="font-semibold text-amber-400">Test Gateway</span>
              </div>
              <div className="flex justify-between">
                <span>Key ID:</span>
                <span className="font-mono text-slate-300">{process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_***"}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <RazorpayCheckoutButton
              amount={amountPaise}
              currency="INR"
              name="SchoolPay Demo"
              description={`Test Checkout for ₹${amountRupees}`}
              buttonText={`Pay ₹${amountRupees} via Razorpay`}
              className="w-full py-6 text-base shadow-lg shadow-blue-600/20"
              onSuccess={(data) => {
                setVerificationLog(data)
                setErrorLog(null)
              }}
              onError={(err) => {
                setErrorLog(err)
                setVerificationLog(null)
              }}
            />
          </CardFooter>
        </Card>

        {verificationLog && (
          <Card className="bg-emerald-950/20 border-emerald-500/30 text-emerald-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Signature Verified Successfully
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs font-mono space-y-1 overflow-x-auto">
              <p><span className="text-slate-400">Order ID:</span> {verificationLog.razorpay_order_id}</p>
              <p><span className="text-slate-400">Payment ID:</span> {verificationLog.razorpay_payment_id}</p>
              <p className="truncate"><span className="text-slate-400">Signature:</span> {verificationLog.razorpay_signature}</p>
            </CardContent>
          </Card>
        )}

        {errorLog && (
          <Card className="bg-red-950/20 border-red-500/30 text-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-400">
                <AlertCircle className="w-4 h-4 text-red-500" /> Payment Verification / Error
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs font-mono">
              <p>{errorLog.message || errorLog.description || JSON.stringify(errorLog)}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
