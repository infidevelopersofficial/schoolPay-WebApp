import Link from "next/link"
import { ShieldCheck, Twitter, Facebook, Instagram, Linkedin } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t py-12 md:py-16 bg-slate-50 dark:bg-slate-950">
      <div className="container grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="flex flex-col">
          <Link href="/" className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl inline-block">SchoolPay Technologies</span>
          </Link>
          <p className="text-sm text-muted-foreground max-w-xs mb-6">
            The Complete School Management Platform for India. Built for Indian schools.
          </p>
        </div>
        
        <div>
          <h3 className="font-semibold mb-4">Links</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li><Link href="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-primary">Terms of Service</Link></li>
            <li><a href="mailto:support@schoolpay.in" className="hover:text-primary">Contact</a></li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-semibold mb-4">Contact Info</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li><a href="tel:8369704457" className="hover:text-primary">Phone: 8369704457</a></li>
            <li><a href="mailto:support@schoolpay.in" className="hover:text-primary">Email: support@schoolpay.in</a></li>
          </ul>
        </div>
      </div>
      
      <div className="container mt-12 pt-8 border-t flex flex-col justify-between items-start gap-4 text-sm text-muted-foreground">
        <p>
          Shop No. 14, Rashmi Laxmi Sadan,<br />
          Near Bhayandar East Station,<br />
          Bhayander East - 401105, Thane, Maharashtra
        </p>
        <p>© 2025 SchoolPay Technologies. All rights reserved.</p>
      </div>
    </footer>
  )
}
