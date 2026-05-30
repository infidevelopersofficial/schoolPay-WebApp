import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, CheckCircle2, GraduationCap, Users, BookOpen, CreditCard, PieChart, Shield } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "SchoolPay | Modern School Management Software",
  description: "Manage admissions, attendance, fees, exams, parent communication, and student records from a single platform. Built for schools, coaching classes, and tutors.",
  alternates: { canonical: "/" },
  keywords: ["school management", "fee collection", "attendance tracking", "coaching class software", "student information system"],
  robots: { index: true, follow: true },
  openGraph: {
    title: "SchoolPay | Modern School Management Software",
    description: "Manage admissions, attendance, fees, exams, and student records from a single platform.",
    type: "website",
    images: [{ url: "/placeholder.jpg", width: 1200, height: 630, alt: "SchoolPay" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SchoolPay",
    description: "Modern school management software for K-12 and coaching classes.",
    images: ["/placeholder.jpg"],
  },
}

export default function MarketingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SchoolPay",
    url: "https://schoolpay.example.com",
    logo: "https://schoolpay.example.com/icon.svg",
    sameAs: [
      "https://twitter.com/schoolpay",
      "https://linkedin.com/company/schoolpay"
    ]
  };

  return (
    <div className="flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero Section */}
      <section className="relative px-6 pt-24 pb-32 md:pt-32 md:pb-48 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-white dark:from-slate-900 dark:via-background dark:to-background"></div>
        <div className="container flex flex-col items-center text-center gap-8 z-10 max-w-4xl">
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2"></span>
            Now supporting multi-campus institutions
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white">
            Modern School Management Software for <span className="text-blue-600 dark:text-blue-500">Schools, Coaching Classes & Tutors</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Manage admissions, attendance, fees, exams, parent communication, and student records from a single, unified platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
            <Button size="lg" className="h-12 px-8 text-base shadow-lg" asChild>
              <Link href="/register?plan=free_demo">Start Free Demo</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base bg-white dark:bg-slate-950" asChild>
              <Link href="/register?plan=starter">Get Started</Link>
            </Button>
            <Button size="lg" variant="ghost" className="h-12 px-8 text-base" asChild>
              <Link href="/login">Login <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust & Credibility Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/20 border-y">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Why SchoolPay?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Built from the ground up to solve the operational chaos of running an educational institution.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex flex-col gap-3 p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border">
              <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Multi-Tenant Architecture</h3>
              <p className="text-muted-foreground leading-relaxed">Enterprise-grade data isolation. Your school's data is completely separate and secure.</p>
            </div>
            <div className="flex flex-col gap-3 p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border">
              <div className="h-12 w-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
                <CreditCard className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Online Fee Collection</h3>
              <p className="text-muted-foreground leading-relaxed">Automated invoicing, payment gateways, and instant receipts. Say goodbye to cash management.</p>
            </div>
            <div className="flex flex-col gap-3 p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border">
              <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-2">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Attendance Automation</h3>
              <p className="text-muted-foreground leading-relaxed">One-click attendance tracking with automatic SMS/Email alerts to parents for absentees.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section id="features" className="py-24">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Everything you need to run your institution</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">A comprehensive suite of modules designed to streamline every aspect of school administration.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-md bg-white/50 dark:bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <Users className="h-8 w-8 text-blue-500 mb-3" />
                <CardTitle>Student Management</CardTitle>
                <CardDescription>Complete lifecycle management from admission to alumni.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-md bg-white/50 dark:bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <BookOpen className="h-8 w-8 text-orange-500 mb-3" />
                <CardTitle>Exams & Gradebook</CardTitle>
                <CardDescription>Customizable grading scales, report cards, and analytics.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-md bg-white/50 dark:bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <GraduationCap className="h-8 w-8 text-emerald-500 mb-3" />
                <CardTitle>Student Portal</CardTitle>
                <CardDescription>Self-service dashboard for assignments, results, and schedules.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-0 shadow-md bg-white/50 dark:bg-slate-900/50 backdrop-blur">
              <CardHeader>
                <PieChart className="h-8 w-8 text-purple-500 mb-3" />
                <CardTitle>Parent Portal</CardTitle>
                <CardDescription>Real-time updates on attendance, fees, and academic progress.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Screenshots Section Layout */}
      <section className="py-24 bg-slate-950 text-white overflow-hidden">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Powerful Dashboards</h2>
              <p className="text-slate-400 text-lg max-w-md">
                Get a bird's eye view of your entire institution. Monitor daily fee collections, attendance trends, and upcoming events in real-time.
              </p>
              <ul className="space-y-3 pt-4">
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-400" /> Admin & Teacher views</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-400" /> Dedicated Parent Portal</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-400" /> Mobile-responsive Student Portal</li>
              </ul>
              <div className="pt-6">
                <Button variant="secondary" size="lg" asChild>
                  <Link href="/register?plan=free_demo">Explore in Demo</Link>
                </Button>
              </div>
            </div>
            <div className="flex-1 w-full max-w-xl relative">
              <div className="aspect-[4/3] rounded-xl bg-slate-800 border border-slate-700 shadow-2xl overflow-hidden relative">
                {/* Placeholder for actual screenshot image */}
                <div className="absolute inset-0 flex items-center justify-center text-slate-600 font-medium">
                  [Dashboard Screenshot Placeholder]
                </div>
                {/* Decorative UI elements for the placeholder */}
                <div className="absolute top-0 left-0 w-full h-12 bg-slate-900 border-b border-slate-700 flex items-center px-4 gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
              </div>
              
              {/* Floating accent images */}
              <div className="absolute -bottom-12 -left-12 w-48 aspect-video rounded-lg bg-slate-800 border border-slate-600 shadow-xl overflow-hidden hidden md:flex items-center justify-center text-xs text-slate-500">
                [Mobile View Placeholder]
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who Uses SchoolPay Section */}
      <section className="py-24">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Built for Every Educational Model</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Whether you run a large K-12 school or a boutique coaching class, our architecture adapts to your needs.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center p-6 flex flex-col items-center">
              <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🏫</span>
              </div>
              <h3 className="text-xl font-bold mb-2">K-12 Schools</h3>
              <p className="text-muted-foreground text-sm">Manage thousands of students, complex fee structures, and multi-term academic years effortlessly.</p>
            </Card>
            <Card className="text-center p-6 flex flex-col items-center border-primary shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
              <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Coaching Centers</h3>
              <p className="text-muted-foreground text-sm">Handle batch-wise enrollments, monthly installments, and test series scheduling seamlessly.</p>
            </Card>
            <Card className="text-center p-6 flex flex-col items-center">
              <div className="h-16 w-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">👨‍🏫</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Private Tutors</h3>
              <p className="text-muted-foreground text-sm">A lightweight setup to collect fees online and track attendance without complex administrative overhead.</p>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-50 dark:bg-slate-900/20 border-t">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Choose the plan that fits your institution's needs.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="flex flex-col border-2 border-transparent">
              <CardHeader>
                <CardTitle>Free Demo</CardTitle>
                <CardDescription>Try for 30 days</CardDescription>
                <div className="text-3xl font-bold mt-4">₹0</div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2 text-sm">
                  <li><CheckCircle2 className="inline h-4 w-4 mr-2 text-emerald-500" /> Full feature access</li>
                  <li><CheckCircle2 className="inline h-4 w-4 mr-2 text-emerald-500" /> Max 50 students</li>
                  <li><CheckCircle2 className="inline h-4 w-4 mr-2 text-emerald-500" /> Basic support</li>
                </ul>
              </CardContent>
              <div className="p-6 mt-auto">
                <Button className="w-full" variant="outline" asChild><Link href="/register?plan=free_demo">Start Demo</Link></Button>
              </div>
            </Card>

            <Card className="flex flex-col border-2 border-transparent">
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <CardDescription>For small coaching classes</CardDescription>
                <div className="text-3xl font-bold mt-4">₹999<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2 text-sm">
                  <li><CheckCircle2 className="inline h-4 w-4 mr-2 text-emerald-500" /> Up to 200 students</li>
                  <li><CheckCircle2 className="inline h-4 w-4 mr-2 text-emerald-500" /> Fee management</li>
                  <li><CheckCircle2 className="inline h-4 w-4 mr-2 text-emerald-500" /> Attendance tracking</li>
                </ul>
              </CardContent>
              <div className="p-6 mt-auto">
                <Button className="w-full" asChild><Link href="/register?plan=starter">Get Starter</Link></Button>
              </div>
            </Card>

            <Card className="flex flex-col border-2 border-blue-500 relative shadow-lg">
              <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">POPULAR</div>
              <CardHeader>
                <CardTitle>Growth</CardTitle>
                <CardDescription>For growing schools</CardDescription>
                <div className="text-3xl font-bold mt-4">₹2,499<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2 text-sm">
                  <li><CheckCircle2 className="inline h-4 w-4 mr-2 text-emerald-500" /> Up to 1,000 students</li>
                  <li><CheckCircle2 className="inline h-4 w-4 mr-2 text-emerald-500" /> Parent portal</li>
                  <li><CheckCircle2 className="inline h-4 w-4 mr-2 text-emerald-500" /> Exams & Gradebook</li>
                  <li><CheckCircle2 className="inline h-4 w-4 mr-2 text-emerald-500" /> Priority support</li>
                </ul>
              </CardContent>
              <div className="p-6 mt-auto">
                <Button className="w-full bg-blue-600 hover:bg-blue-700" asChild><Link href="/register?plan=growth">Get Growth</Link></Button>
              </div>
            </Card>

            <Card className="flex flex-col border-2 border-transparent">
              <CardHeader>
                <CardTitle>Pro</CardTitle>
                <CardDescription>For large K-12 institutions</CardDescription>
                <div className="text-3xl font-bold mt-4">₹4,999<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2 text-sm">
                  <li><CheckCircle2 className="inline h-4 w-4 mr-2 text-emerald-500" /> Unlimited students</li>
                  <li><CheckCircle2 className="inline h-4 w-4 mr-2 text-emerald-500" /> Multi-branch support</li>
                  <li><CheckCircle2 className="inline h-4 w-4 mr-2 text-emerald-500" /> Custom domain</li>
                  <li><CheckCircle2 className="inline h-4 w-4 mr-2 text-emerald-500" /> Dedicated account manager</li>
                </ul>
              </CardContent>
              <div className="p-6 mt-auto">
                <Button className="w-full" asChild><a href="mailto:support@schoolpay.in">Get Pro</a></Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-blue-600 text-white text-center">
        <div className="container max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to transform your institution?</h2>
          <p className="text-blue-100 text-lg mb-8">Join hundreds of educators who have simplified their administration and boosted their fee collections with SchoolPay.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" variant="secondary" className="h-14 px-8 text-lg font-semibold" asChild>
              <Link href="/register?plan=free_demo">Start Free Demo</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold border-white text-white hover:bg-white hover:text-blue-600" asChild>
              <Link href="/register?plan=free_demo">View Pricing Plans</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
