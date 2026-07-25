"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, CreditCard } from "lucide-react"

interface RazorpayCheckoutButtonProps {
  amount?: number // Amount in paise (minimum 100)
  currency?: string
  receipt?: string
  name?: string
  description?: string
  prefillName?: string
  prefillEmail?: string
  prefillContact?: string
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
  buttonText?: string
  className?: string
  disabled?: boolean
}

export function RazorpayCheckoutButton({
  amount = 10000, // Default ₹100.00 (10000 paise)
  currency = "INR",
  receipt,
  name = "SchoolPay Platform",
  description = "Standard Fee Checkout",
  prefillName = "Student Admin",
  prefillEmail = "admin@schoolpay.com",
  prefillContact = "9876543210",
  onSuccess,
  onError,
  buttonText = "Pay Now",
  className = "",
  disabled = false,
}: RazorpayCheckoutButtonProps) {
  const [loading, setLoading] = useState(false)

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true)
        return
      }
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handlePayment = async () => {
    try {
      setLoading(true)

      // Step 1: Backend - Create Order
      const createRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, currency, receipt }),
      })

      const orderData = await createRes.json()
      if (!createRes.ok || !orderData.order_id) {
        throw new Error(orderData.error || "Failed to initiate payment order")
      }

      // Step 2: Load SDK script
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        throw new Error("Failed to load Razorpay checkout script. Check network connection.")
      }

      // Step 3: Configure Razorpay Checkout Modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name,
        description,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          try {
            // Step 4: Backend - Verify Signature
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })

            const verifyData = await verifyRes.json()
            if (verifyRes.ok && verifyData.success) {
              toast.success("Payment verified successfully!")
              if (onSuccess) onSuccess(verifyData)
            } else {
              toast.error(verifyData.error || "Payment signature verification failed")
              if (onError) onError(new Error(verifyData.error || "Verification failed"))
            }
          } catch (err: any) {
            toast.error("Network error during payment verification")
            if (onError) onError(err)
          } finally {
            setLoading(false)
          }
        },
        prefill: {
          name: prefillName,
          email: prefillEmail,
          contact: prefillContact,
        },
        theme: {
          color: "#2563EB", // blue-600
        },
        modal: {
          ondismiss: function () {
            toast.info("Payment checkout cancelled by user.")
            setLoading(false)
          },
        },
      }

      const rzp = new (window as any).Razorpay(options)

      // Handle payment.failed event
      rzp.on("payment.failed", function (response: any) {
        const errorMsg = response.error?.description || "Payment processing failed"
        toast.error(`Payment Failed: ${errorMsg}`)
        if (onError) onError(response.error)
        setLoading(false)
      })

      rzp.open()
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout")
      if (onError) onError(err)
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || loading}
      className={`bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center justify-center gap-2 ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" /> Processing...
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4" /> {buttonText}
        </>
      )}
    </Button>
  )
}
