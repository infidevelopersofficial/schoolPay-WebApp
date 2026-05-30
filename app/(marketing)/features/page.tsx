import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, GraduationCap, Users, BookOpen, CreditCard, PieChart, Calendar, MessageSquare, Bell } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Features | SchoolPay",
  description: "Explore the core modules of SchoolPay. Comprehensive school management software for modern institutions.",
  alternates: { canonical: "/features" },
  keywords: ["schoolpay features", "school management modules", "student information system features"],
  robots: { index: true, follow: true },
  openGraph: {
    title: "Features | SchoolPay",
    description: "Explore the core modules of SchoolPay.",
    type: "website",
  },
}

export default function FeaturesPage() {
  const features = [
    {
      title: "Admissions & Enrollment",
      description: "Streamline your entire admission process from inquiry to enrollment. Capture student data, manage documents, and generate roll numbers automatically.",
      icon: <Users className="h-6 w-6 text-blue-500" />
    },
    {
      title: "Attendance Automation",
      description: "Mark attendance in seconds. Automatically notify parents via SMS or Email when a student is absent. View daily, monthly, and yearly attendance reports.",
      icon: <Calendar className="h-6 w-6 text-rose-500" />
    },
    {
      title: "Fees & Online Payments",
      description: "Automate fee structures, generate invoices, and collect payments online via Razorpay. Instantly issue digital receipts and track defaulters.",
      icon: <CreditCard className="h-6 w-6 text-emerald-500" />
    },
    {
      title: "Exams & Gradebook",
      description: "Schedule exams, record marks, and generate comprehensive report cards. Support for multiple grading scales and continuous evaluation.",
      icon: <BookOpen className="h-6 w-6 text-orange-500" />
    },
    {
      title: "Parent Portal",
      description: "A dedicated mobile-friendly portal for parents to view their child's academic progress, pay fees, and communicate with teachers.",
      icon: <PieChart className="h-6 w-6 text-purple-500" />
    },
    {
      title: "Student Portal",
      description: "Empower students with their own dashboard to access study materials, view timetables, check results, and submit assignments.",
      icon: <GraduationCap className="h-6 w-6 text-indigo-500" />
    },
    {
      title: "Communication (SMS/Email)",
      description: "Send instant updates, holiday notices, and fee reminders to parents and staff via integrated SMS and Email gateways.",
      icon: <MessageSquare className="h-6 w-6 text-teal-500" />
    },
    {
      title: "Announcements & Events",
      description: "Publish school-wide announcements, manage the academic calendar, and organize events with ease.",
      icon: <Bell className="h-6 w-6 text-amber-500" />
    }
  ]

  return (
    <div className="container py-24">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Powerful Features for Modern Schools</h1>
        <p className="text-xl text-muted-foreground">
          SchoolPay provides an end-to-end suite of tools designed to eliminate administrative overhead and improve communication.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, i) => (
          <Card key={i} className="border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="mb-4 h-12 w-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                {feature.icon}
              </div>
              <CardTitle className="text-xl">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
