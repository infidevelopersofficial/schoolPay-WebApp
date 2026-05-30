import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar as CalendarIcon, Video } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Book a Demo | SchoolPay",
  description: "Schedule a personalized demo of SchoolPay to see how we can transform your institution's management.",
  alternates: { canonical: "/demo" },
  keywords: ["schoolpay demo", "book demo school management"],
  robots: { index: true, follow: true },
  openGraph: {
    title: "Book a Demo | SchoolPay",
    description: "Schedule a personalized demo of SchoolPay.",
    type: "website",
  },
}

export default function DemoPage() {
  return (
    <div className="container py-24">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">See SchoolPay in Action</h1>
        <p className="text-xl text-muted-foreground">
          Schedule a personalized, 30-minute product tour with our experts to learn how SchoolPay can fit your specific needs.
        </p>
      </div>

      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-center justify-center">
        <Card className="flex-1 w-full max-w-md shadow-lg border-t-4 border-t-primary text-center">
          <CardHeader>
            <div className="mx-auto h-16 w-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <Video className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl">Live Guided Demo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              A 1-on-1 session covering admissions, fee collection, attendance, and portables. We'll answer any technical questions you have.
            </p>
            <Button size="lg" className="w-full h-12 text-lg">
              <CalendarIcon className="mr-2 h-5 w-5" /> Schedule on Calendly
            </Button>
            <p className="text-xs text-muted-foreground">
              * Calendly integration is a placeholder for this demo.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
