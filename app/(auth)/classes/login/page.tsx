import { LoginForm } from "@/app/(auth)/login/login-form";
import { Presentation } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coaching Center Sign In — SchoolPay",
  description: "Sign in to your Coaching Center account",
};

export default function CoachingLoginPage() {
  return (
    <div className="flex flex-col justify-center min-h-screen p-4 bg-slate-950 sm:p-8">
      <div className="w-full max-w-sm mx-auto space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500 mb-2">
            <Presentation className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Coaching Login</h1>
          <p className="text-slate-400 text-sm">
            Welcome back! Please enter your details.
          </p>
        </div>

        <LoginForm />
        
        <div className="text-center text-sm text-slate-500">
          <a href="/login-type-selector" className="hover:text-slate-300 transition-colors">
            ← Back to organization selection
          </a>
        </div>
      </div>
    </div>
  );
}
