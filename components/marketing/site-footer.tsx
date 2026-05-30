import Link from "next/link"
import { ShieldCheck, Twitter, Facebook, Instagram, Linkedin } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t py-12 md:py-16 bg-slate-50 dark:bg-slate-950">
      <div className="container grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
        <div className="col-span-2 lg:col-span-2">
          <Link href="/" className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl inline-block">SchoolPay</span>
          </Link>
          <p className="text-sm text-muted-foreground max-w-xs mb-6">
            Modern school management software designed for schools, coaching classes, and private tutors to streamline operations and fee collection.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-muted-foreground hover:text-primary"><Twitter className="h-5 w-5" /></Link>
            <Link href="#" className="text-muted-foreground hover:text-primary"><Facebook className="h-5 w-5" /></Link>
            <Link href="#" className="text-muted-foreground hover:text-primary"><Instagram className="h-5 w-5" /></Link>
            <Link href="#" className="text-muted-foreground hover:text-primary"><Linkedin className="h-5 w-5" /></Link>
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold mb-4">Product</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li><Link href="/#features" className="hover:text-primary">Features</Link></li>
            <li><Link href="/#pricing" className="hover:text-primary">Pricing</Link></li>
            <li><Link href="/register?plan=free_demo" className="hover:text-primary">Book Demo</Link></li>
            <li><Link href="/login" className="hover:text-primary">Login</Link></li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-semibold mb-4">Solutions</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li><Link href="#" className="hover:text-primary">For K-12 Schools</Link></li>
            <li><Link href="#" className="hover:text-primary">For Coaching Classes</Link></li>
            <li><Link href="#" className="hover:text-primary">For Private Tutors</Link></li>
            <li><Link href="#" className="hover:text-primary">For Multi-Campus</Link></li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-semibold mb-4">Company</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li><Link href="/" className="hover:text-primary">About Us</Link></li>
            <li><a href="mailto:support@schoolpay.in" className="hover:text-primary">Contact</a></li>
            <li><Link href="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-primary">Terms of Service</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="container mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} SchoolPay Inc. All rights reserved.</p>
        <p>Built with ❤️ for educators globally.</p>
      </div>
    </footer>
  )
}
