import type { Metadata } from "next"
import Image from "next/image"
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Full-screen background image */}
      <Image
        src="/login-bg.png"
        alt="School campus illustration"
        fill
        className="object-cover"
        priority
      />

      {/* Gradient overlay across the entire background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/70 via-primary/50 to-accent/40" />

      {/* Subtle animated floating shapes for depth */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-white/5 blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl animate-pulse [animation-delay:2s]" />
        <div className="absolute top-1/4 right-1/4 h-48 w-48 rounded-full bg-white/5 blur-2xl animate-pulse [animation-delay:4s]" />
      </div>

      {/* Main content container */}
      <div className="relative z-10 flex w-full max-w-5xl mx-4 lg:mx-auto gap-0 rounded-3xl overflow-hidden shadow-2xl shadow-black/30">

        {/* Left panel — Branding (visible on lg+) */}
        <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-white/5 backdrop-blur-md border-r border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <School className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-white">SchoolPay</span>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-white leading-tight">
                Streamline your school&apos;s
                <br />
                fee management
              </h1>
              <p className="text-white/80 text-lg max-w-md">
                Track payments, manage students, and generate reports — all in one place.
              </p>
            </div>

            {/* Illustration */}
            <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl shadow-black/30 ring-1 ring-white/10">
              <Image
                src="/login-illustration.png"
                alt="School administrator managing fee payments on a laptop"
                width={560}
                height={560}
                className="w-full h-auto object-cover"
                priority
              />
              {/* Subtle gradient overlay on image bottom for smooth blend */}
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-primary/40 to-transparent" />
            </div>
          </div>

          <p className="text-white/50 text-sm">© 2025 SchoolPay. All rights reserved.</p>
        </div>

        {/* Right panel — Login form with glassmorphism */}
        <div className="flex flex-1 items-center justify-center p-8 sm:p-12 bg-white/10 backdrop-blur-xl border border-white/10 lg:border-l-0 lg:rounded-l-none">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile-only branding */}
            <div className="lg:hidden flex items-center gap-3 justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <School className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-white">SchoolPay</span>
            </div>

            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-bold tracking-tight text-white">Welcome back</h2>
              <p className="mt-2 text-white/60">Enter your credentials to access your account</p>
            </div>

            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}
