import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { LoginForm } from "./login-form"
import { School } from "lucide-react"

export const metadata: Metadata = {
  title: "Sign In — SchoolPay",
  description: "Sign in to your SchoolPay account to manage school fees and payments.",
}

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect("/")

  return (
    <div className="flex min-h-screen">
      {/* Left panel — Branding (visible on lg+) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-accent/70 p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <School className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-white">SchoolPay</span>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Streamline your school&apos;s
            <br />
            fee management
          </h1>
          <p className="text-white/80 text-lg max-w-md">
            Track payments, manage students, and generate reports — all in one place.
          </p>
        </div>

        <p className="text-white/50 text-sm">© 2025 SchoolPay. All rights reserved.</p>
      </div>

      {/* Right panel — Login form */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile-only branding */}
          <div className="lg:hidden flex items-center gap-3 justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
              <School className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">SchoolPay</span>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h2>
            <p className="mt-2 text-muted-foreground">Enter your credentials to access your account</p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  )
}
