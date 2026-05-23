import { auth } from "@/lib/auth"
import { getBillingContext } from "@/lib/billing/limits"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export async function GracePeriodBanner() {
  const session = await auth()
  if (!session?.user?.activeSchoolId) return null

  const billingCtx = await getBillingContext(session.user.activeSchoolId)
  if (!billingCtx) return null

  if (billingCtx.subscription.status !== "GRACE_PERIOD" && billingCtx.subscription.status !== "PAST_DUE") {
    return null
  }

  const isPastDue = billingCtx.subscription.status === "PAST_DUE"

  return (
    <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between shadow-md relative z-50">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        <span className="text-sm font-medium">
          {isPastDue 
            ? "Your subscription payment failed. Please update your payment method."
            : `You have exceeded the limits of the \${billingCtx.plan.name} plan. Your account is in Grace Period.`
          }
        </span>
      </div>
      <Link 
        href="/settings/billing" 
        className="text-xs bg-white text-red-600 px-3 py-1.5 rounded-md font-bold hover:bg-red-50 transition-colors"
      >
        {isPastDue ? "Update Payment" : "Upgrade Plan"}
      </Link>
    </div>
  )
}
