"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Script from "next/script"

interface CheckoutButtonProps {
  planId: string
  planName: string
}

export function CheckoutButton({ planId, planName }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    setLoading(true)
    try {
      // 1. Create Subscription
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billingCycle: "MONTHLY" }), // Default to monthly for now
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate checkout")
      }

      // 2. Open Razorpay Checkout
      const options = {
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "SchoolPay SaaS",
        description: `\${planName} Plan Subscription`,
        handler: function (response: any) {
          toast.success("Payment successful! Your plan is being upgraded.")
          // Reload or navigate
          setTimeout(() => window.location.reload(), 2000)
        },
        theme: {
          color: "#003366",
        },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.on("payment.failed", function (response: any) {
        toast.error("Payment failed. Please try again.")
      })
      rzp.open()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Button onClick={handleCheckout} disabled={loading} className="w-full">
        {loading ? "Processing..." : "Upgrade"}
      </Button>
    </>
  )
}
