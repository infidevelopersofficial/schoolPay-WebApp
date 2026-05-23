import { StudentLoginForm } from "./student-login-form";
import { School } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "School Sign In — SchoolPay",
  description: "Sign in to your School account",
};

export default function SchoolLoginPage() {
  return (
    <div className="flex flex-col justify-center min-h-screen p-4 bg-slate-950 sm:p-8">
      <div className="w-full max-w-sm mx-auto space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="p-3 rounded-full bg-blue-500/10 text-blue-500 mb-2">
            <School className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Student Portal Login</h1>
          <p className="text-slate-400 text-sm">
            Welcome back! Please enter your details.
          </p>
        </div>

        <StudentLoginForm />
        
        <div className="text-center text-sm text-slate-500">
          <a href="/login-type-selector" className="hover:text-slate-300 transition-colors">
            ← Back to organization selection
          </a>
        </div>
      </div>
    </div>
  );
}
