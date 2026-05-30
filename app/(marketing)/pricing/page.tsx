import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pricing | SchoolPay",
  description: "Simple, transparent pricing for schools, coaching centers, and tutors. Start with a free trial today.",
  alternates: { canonical: "/pricing" },
  keywords: ["schoolpay pricing", "school software pricing", "coaching class management cost"],
  robots: { index: true, follow: true },
  openGraph: {
    title: "Pricing | SchoolPay",
    description: "Simple, transparent pricing for educational institutions.",
    type: "website",
  },
}

export default function PricingPage() {
  return (
    <div className="container py-24">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Simple, Transparent Pricing</h1>
        <p className="text-xl text-muted-foreground">
          Choose the plan that best fits your institution's size and needs. No hidden fees.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Starter Plan */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-2xl">Starter</CardTitle>
            <CardDescription>For Small Schools & Tutors</CardDescription>
            <div className="mt-4 flex items-baseline text-5xl font-extrabold">
              $29
              <span className="ml-1 text-xl font-medium text-muted-foreground">/mo</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3 items-center"><CheckCircle2 className="h-5 w-5 text-primary" /> Up to 250 Students</li>
              <li className="flex gap-3 items-center"><CheckCircle2 className="h-5 w-5 text-primary" /> Core Attendance Tracking</li>
              <li className="flex gap-3 items-center"><CheckCircle2 className="h-5 w-5 text-primary" /> Basic Fee Collection</li>
              <li className="flex gap-3 items-center"><CheckCircle2 className="h-5 w-5 text-primary" /> 1 Admin Account</li>
              <li className="flex gap-3 items-center"><CheckCircle2 className="h-5 w-5 text-primary" /> Email Support</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/register?plan=starter">Start Free Trial</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Professional Plan */}
        <Card className="flex flex-col border-primary shadow-lg relative transform md:-translate-y-4">
          <div className="absolute top-0 inset-x-0 bg-primary text-primary-foreground text-center py-1 text-xs font-bold uppercase tracking-wider rounded-t-lg">
            Most Popular
          </div>
          <CardHeader className="pt-8">
            <CardTitle className="text-2xl">Professional</CardTitle>
            <CardDescription>For Schools & Coaching Centers</CardDescription>
            <div className="mt-4 flex items-baseline text-5xl font-extrabold">
              $99
              <span className="ml-1 text-xl font-medium text-muted-foreground">/mo</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3 items-center"><CheckCircle2 className="h-5 w-5 text-primary" /> Up to 1,000 Students</li>
              <li className="flex gap-3 items-center"><CheckCircle2 className="h-5 w-5 text-primary" /> Parent & Student Portals</li>
              <li className="flex gap-3 items-center"><CheckCircle2 className="h-5 w-5 text-primary" /> Advanced Fee Management</li>
              <li className="flex gap-3 items-center"><CheckCircle2 className="h-5 w-5 text-primary" /> Exams & Gradebook</li>
              <li className="flex gap-3 items-center"><CheckCircle2 className="h-5 w-5 text-primary" /> SMS/Email Notifications</li>
              <li className="flex gap-3 items-center"><CheckCircle2 className="h-5 w-5 text-primary" /> 5 Admin/Teacher Accounts</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" asChild>
              <Link href="/register?plan=growth">Start Free Trial</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Enterprise Plan */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-2xl">Enterprise</CardTitle>
            <CardDescription>For Multi-Campus Institutions</CardDescription>
            <div className="mt-4 flex items-baseline text-5xl font-extrabold">
              $299
              <span className="ml-1 text-xl font-medium text-muted-foreground">/mo</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3 items-center"><CheckCircle2 className="h-5 w-5 text-primary" /> Unlimited Students</li>
              <li className="flex gap-3 items-center"><CheckCircle2 className="h-5 w-5 text-primary" /> Multi-Branch Management</li>
              <li className="flex gap-3 items-center"><CheckCircle2 className="h-5 w-5 text-primary" /> Custom Payment Gateway</li>
              <li className="flex gap-3 items-center"><CheckCircle2 className="h-5 w-5 text-primary" /> White-labeled Portals</li>
              <li className="flex gap-3 items-center"><CheckCircle2 className="h-5 w-5 text-primary" /> Unlimited Staff Accounts</li>
              <li className="flex gap-3 items-center"><CheckCircle2 className="h-5 w-5 text-primary" /> Priority 24/7 Phone Support</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/register?plan=free_demo">Contact Sales</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
