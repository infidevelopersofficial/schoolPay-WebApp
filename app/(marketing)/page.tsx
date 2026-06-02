import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "SchoolPay | Modern School Management Software",
  description: "The Complete School Management Platform for India. Built for Indian schools.",
}

export default function MarketingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* SECTION 2 — Hero */}
      <section className="relative px-6 pt-24 pb-32 md:pt-32 md:pb-48 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-white dark:from-slate-900 dark:via-background dark:to-background"></div>
        <div className="container flex flex-col items-center text-center gap-8 z-10 max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white">
            The Complete School Management Platform for India
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Fee collection, attendance, reports and parent communication — all in one place. Built for Indian schools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
            <Button size="lg" className="h-12 px-8 text-base shadow-lg" asChild>
              <Link href="/register?plan=free_demo">Start Free Demo</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base bg-white dark:bg-slate-950" asChild>
              <Link href="/login">Login to your school</Link>
            </Button>
          </div>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            Trusted by schools in Maharashtra · No credit card required
          </p>
        </div>
      </section>

      {/* SECTION 3 — Features */}
      <section id="features" className="py-24 border-t">
        <div className="container">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border shadow-sm">
              <CardHeader>
                <div className="text-3xl mb-2">📋</div>
                <CardTitle>Fee Management</CardTitle>
                <CardDescription>Collect fees, generate receipts, track dues</CardDescription>
              </CardHeader>
            </Card>
            <Card className="border shadow-sm">
              <CardHeader>
                <div className="text-3xl mb-2">📊</div>
                <CardTitle>Attendance</CardTitle>
                <CardDescription>Mark and monitor daily attendance</CardDescription>
              </CardHeader>
            </Card>
            <Card className="border shadow-sm">
              <CardHeader>
                <div className="text-3xl mb-2">👨‍👩‍👧</div>
                <CardTitle>Parent Portal</CardTitle>
                <CardDescription>Parents view fees and download receipts</CardDescription>
              </CardHeader>
            </Card>
            <Card className="border shadow-sm">
              <CardHeader>
                <div className="text-3xl mb-2">📈</div>
                <CardTitle>Reports</CardTitle>
                <CardDescription>Fee collection, defaulters, attendance reports</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* SECTION 4 — Pricing */}
      <section id="pricing" className="py-24 bg-slate-50 dark:bg-slate-900/20 border-t">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Simple pricing for every school</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Prices exclusive of 18% GST</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            
            <Card className="flex flex-col border-2 border-transparent">
              <CardHeader>
                <CardTitle>Free Demo</CardTitle>
                <div className="text-3xl font-bold mt-4">₹0</div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2 text-sm">
                  <li><CheckCircle2 className="inline h-4 w-4 mr-2 text-emerald-500" /> Full feature access</li>
                  <li><CheckCircle2 className="inline h-4 w-4 mr-2 text-emerald-500" /> Max 50 students</li>
                </ul>
              </CardContent>
              <div className="p-6 mt-auto">
                <Button className="w-full" variant="outline" asChild><Link href="/register?plan=free_demo">Start Free Demo</Link></Button>
              </div>
            </Card>

            <Card className="flex flex-col border-2 border-transparent">
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <div className="text-3xl font-bold mt-4">₹999<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2 text-sm">
                  <li><CheckCircle2 className="inline h-4 w-4 mr-2 text-emerald-500" /> Up to 200 students</li>
                  <li><CheckCircle2 className="inline h-4 w-4 mr-2 text-emerald-500" /> Fee management</li>
                </ul>
              </CardContent>
              <div className="p-6 mt-auto">
                <Button className="w-full" asChild><Link href="/register?plan=starter">Get Started</Link></Button>
              </div>
            </Card>

            <Card className="flex flex-col border-2 border-blue-500 relative shadow-lg">
              <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">Most Popular</div>
              <CardHeader>
                <CardTitle>Growth</CardTitle>
                <div className="text-3xl font-bold mt-4">₹2,499<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2 text-sm">
                  <li><CheckCircle2 className="inline h-4 w-4 mr-2 text-emerald-500" /> Up to 1,000 students</li>
                  <li><CheckCircle2 className="inline h-4 w-4 mr-2 text-emerald-500" /> Parent portal</li>
                </ul>
              </CardContent>
              <div className="p-6 mt-auto">
                <Button className="w-full bg-blue-600 hover:bg-blue-700" asChild><Link href="/register?plan=growth">Get Started</Link></Button>
              </div>
            </Card>

            <Card className="flex flex-col border-2 border-transparent">
              <CardHeader>
                <CardTitle>Pro</CardTitle>
                <div className="text-3xl font-bold mt-4">₹4,999<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2 text-sm">
                  <li><CheckCircle2 className="inline h-4 w-4 mr-2 text-emerald-500" /> Unlimited students</li>
                  <li><CheckCircle2 className="inline h-4 w-4 mr-2 text-emerald-500" /> Custom domain</li>
                </ul>
              </CardContent>
              <div className="p-6 mt-auto">
                <Button className="w-full" variant="outline" asChild><a href="mailto:support@schoolpay.in">Contact Us</a></Button>
              </div>
            </Card>

          </div>
        </div>
      </section>
    </div>
  )
}
