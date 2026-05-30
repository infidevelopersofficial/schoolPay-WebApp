import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma as db } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { checkBillingHealth } from "@/lib/billing/health-check"

export default async function AdminBillingPage() {
  const session = await auth()
  
  if (!session || session.user.role !== "SYSTEM_ADMIN") {
    redirect("/login")
  }

  // Aggregate Metrics
  const schools = await db.school.findMany({
    include: {
      plan: true,
      subscription: true,
      usageRecord: true
    }
  })

  const totalSchools = schools.length
  const activeSubs = schools.filter(s => s.subscriptionStatus === "ACTIVE").length
  const arr = schools.reduce((acc, s) => acc + (s.plan?.monthlyPrice || 0) * 12, 0) / 100
  
  const recentEvents = await db.billingEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { subscription: { include: { school: { select: { name: true } } } } }
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Billing Diagnostics</h1>
        <p className="text-muted-foreground">SYSTEM_ADMIN restricted view.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total ARR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{arr.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubs} / {totalSchools}</div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold mt-8">Recent Billing Events</h2>
      <div className="bg-white rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="p-3">Date</th>
              <th className="p-3">School</th>
              <th className="p-3">Action</th>
              <th className="p-3">Description</th>
            </tr>
          </thead>
          <tbody>
            {recentEvents.map(event => (
              <tr key={event.id} className="border-b">
                <td className="p-3">{event.createdAt.toLocaleString()}</td>
                <td className="p-3">{event.subscription?.school?.name || event.schoolId}</td>
                <td className="p-3 font-medium">{event.action}</td>
                <td className="p-3 text-muted-foreground">{event.description}</td>
              </tr>
            ))}
            {recentEvents.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-muted-foreground">No events found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-bold mt-8">Testing Harness</h2>
      <Card>
        <CardHeader>
          <CardTitle>Trigger Webhook Mock</CardTitle>
          <CardDescription>Simulate Razorpay events locally without API keys.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex gap-4 items-end" action={async (formData) => {
            "use server";
            const event = formData.get("event") as string;
            const schoolId = formData.get("schoolId") as string;
            await fetch(process.env.NEXTAUTH_URL + "/api/billing/test-webhook", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ event, schoolId })
            });
          }}>
            <div className="space-y-1">
              <label className="text-sm font-medium">Event Type</label>
              <select name="event" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="subscription.charged">subscription.charged</option>
                <option value="subscription.halted">subscription.halted</option>
                <option value="subscription.cancelled">subscription.cancelled</option>
              </select>
            </div>
            <div className="space-y-1 flex-1">
              <label className="text-sm font-medium">School ID</label>
              <input name="schoolId" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Enter school ID..." />
            </div>
            <Button type="submit">Fire Webhook</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
