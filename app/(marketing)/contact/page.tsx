import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Mail, Phone, MapPin, Clock } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact Us | SchoolPay",
  description: "Get in touch with the SchoolPay team for support, sales, or partnership inquiries.",
  alternates: { canonical: "/contact" },
  keywords: ["contact schoolpay", "schoolpay support", "schoolpay sales"],
  robots: { index: true, follow: true },
  openGraph: {
    title: "Contact Us | SchoolPay",
    description: "Get in touch with the SchoolPay team.",
    type: "website",
  },
}

export default function ContactPage() {
  return (
    <div className="container py-24">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Get in Touch</h1>
        <p className="text-xl text-muted-foreground">
          Have questions about our pricing, features, or want a custom enterprise quote? We're here to help.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
        {/* Contact Form */}
        <Card className="shadow-lg border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle className="text-2xl">Send us a Message</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="John Doe" required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="john@school.edu" required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="institution">Institution Name</Label>
                <Input id="institution" placeholder="Springfield High School" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea 
                  id="message" 
                  placeholder="Tell us how we can help..." 
                  className="min-h-[120px]" 
                  required 
                />
              </div>
              
              <Button type="button" className="w-full h-12 text-lg">Send Message</Button>
              <p className="text-xs text-muted-foreground text-center mt-4">
                * Form submission is currently a placeholder for the demo.
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <div className="space-y-8 flex flex-col justify-center">
          <div>
            <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
            <p className="text-muted-foreground mb-8">
              Prefer to reach out directly? Use the information below to contact our sales and support teams.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center shrink-0">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-lg">Email Us</h4>
                <p className="text-muted-foreground">Sales: sales@schoolpay.example.com</p>
                <p className="text-muted-foreground">Support: support@schoolpay.example.com</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center shrink-0">
                <Phone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h4 className="font-semibold text-lg">Call Us</h4>
                <p className="text-muted-foreground">+1 (555) 123-4567</p>
                <p className="text-sm text-muted-foreground mt-1">Mon-Fri from 8am to 6pm EST.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="font-semibold text-lg">Business Hours</h4>
                <p className="text-muted-foreground">Monday - Friday: 9:00 AM - 6:00 PM</p>
                <p className="text-muted-foreground">Saturday & Sunday: Closed</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h4 className="font-semibold text-lg">Office Location</h4>
                <p className="text-muted-foreground">123 Education Way, Suite 400</p>
                <p className="text-muted-foreground">Tech District, NY 10001</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
