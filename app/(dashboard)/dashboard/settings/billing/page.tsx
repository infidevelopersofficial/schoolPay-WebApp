import { auth } from "@/lib/auth"
import { getBillingContext } from "@/lib/billing/limits"
import { prisma as db } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { CheckoutButton } from "./checkout-button"

export default async function BillingPage() {
  const session = await auth()
  if (!session?.user?.activeSchoolId) redirect("/login")

  const billingCtx = await getBillingContext(session.user.activeSchoolId)

  // Wait, if billingCtx is null, we can try to fetch the plans anyway
  const plans = await db.plan.findMany({
    orderBy: { monthlyPrice: 'asc' }
  })

  if (!billingCtx) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Billing context not found. Please contact support.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const { subscription, plan, usage } = billingCtx

  const studentPercentage = Math.min((usage.currentStudents / plan.studentLimit) * 100, 100)
  const staffPercentage = Math.min((usage.currentStaff / plan.staffLimit) * 100, 100)

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription plan, view usage, and update payment methods.
        </p>
      </div>

      {subscription.status === "GRACE_PERIOD" && (
        <Alert variant="destructive" className="bg-red-50 dark:bg-red-950 border-red-500">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertTitle className="text-red-800 dark:text-red-200 font-bold">Action Required</AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-300">
            Your school has exceeded the limits of the {plan.name} plan. You have until{' '}
            {subscription.graceEndsAt ? new Date(subscription.graceEndsAt).toLocaleDateString() : 'the end of your grace period'}
            {' '}to upgrade your plan. Failure to upgrade will result in restricted access.
          </AlertDescription>
        </Alert>
      )}

      {subscription.status === "PAST_DUE" && (
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Payment Failed</AlertTitle>
          <AlertDescription>
            Your latest payment failed. Please update your payment method to avoid service interruption.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>You are currently on the <strong>{plan.name}</strong> plan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold \${
                subscription.status === 'ACTIVE' || subscription.status === 'TRIALING' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {subscription.status.replace("_", " ")}
              </span>
            </div>
            {subscription.currentPeriodEnd && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Period Ends</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              </div>
            )}
          </CardContent>
          {plan.name === "FREE" && (
            <CardFooter>
              <Button variant="outline" className="w-full">Upgrade Plan</Button>
            </CardFooter>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage Metrics</CardTitle>
            <CardDescription>Your current operational limits.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Students</span>
                <span className="text-muted-foreground">
                  {usage.currentStudents} / {plan.studentLimit}
                </span>
              </div>
              <Progress value={studentPercentage} className={studentPercentage > 90 ? "bg-red-100 [&>div]:bg-red-600" : ""} />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Staff Members</span>
                <span className="text-muted-foreground">
                  {usage.currentStaff} / {plan.staffLimit}
                </span>
              </div>
              <Progress value={staffPercentage} className={staffPercentage > 90 ? "bg-red-100 [&>div]:bg-red-600" : ""} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight mt-10 mb-6">Available Plans</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((p) => {
            const isCurrent = p.id === plan.id;
            return (
              <Card key={p.id} className={isCurrent ? "border-primary shadow-md" : ""}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    {p.name}
                    {isCurrent && <span className="text-xs font-normal bg-primary/10 text-primary px-2 py-1 rounded-full">Current</span>}
                  </CardTitle>
                  <CardDescription>{p.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold">
                    ₹{(p.monthlyPrice / 100).toLocaleString()}<span className="text-lg font-normal text-muted-foreground">/mo</span>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" /> Up to {p.studentLimit.toLocaleString()} students</li>
                    <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" /> Up to {p.staffLimit} staff</li>
                    {p.studentPortal && <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" /> Student Portal</li>}
                    {p.parentPortal && <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" /> Parent Portal</li>}
                    {p.lms && <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" /> LMS Features</li>}
                  </ul>
                </CardContent>
                <CardFooter>
                  {!isCurrent && p.name !== "FREE" ? (
                    <CheckoutButton planId={p.id} planName={p.name} />
                  ) : (
                    <Button variant={isCurrent ? "outline" : "secondary"} className="w-full" disabled>
                      {isCurrent ? "Current Plan" : "Contact Sales"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
