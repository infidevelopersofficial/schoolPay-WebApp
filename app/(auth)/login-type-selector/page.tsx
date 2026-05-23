import Link from "next/link";
import { School, Presentation, UserRoundPen } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Select Login — SchoolPay",
  description: "Choose your organization type to sign in",
};

export default function LoginTypeSelectorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-950 text-slate-50">
      <div className="w-full max-w-3xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Welcome to SchoolPay</h1>
          <p className="text-slate-400">Please select your organization type to continue</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {/* School Login */}
          <Link
            href="/school/login"
            className="group relative flex flex-col items-center p-8 space-y-4 rounded-2xl bg-slate-900 border border-slate-800 transition-all hover:bg-slate-800 hover:border-slate-700 hover:-translate-y-1"
          >
            <div className="p-4 rounded-full bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
              <School className="w-8 h-8" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold">K-12 School</h2>
              <p className="mt-2 text-sm text-slate-400">
                For traditional schools with classes, sections, and structured fee schedules.
              </p>
            </div>
          </Link>

          {/* Coaching Login */}
          <Link
            href="/classes/login"
            className="group relative flex flex-col items-center p-8 space-y-4 rounded-2xl bg-slate-900 border border-slate-800 transition-all hover:bg-slate-800 hover:border-slate-700 hover:-translate-y-1"
          >
            <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
              <Presentation className="w-8 h-8" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold">Coaching Center</h2>
              <p className="mt-2 text-sm text-slate-400">
                For institutes with flexible batches, test series, and lead management.
              </p>
            </div>
          </Link>

          {/* Tutor Login */}
          <Link
            href="/tutor/login"
            className="group relative flex flex-col items-center p-8 space-y-4 rounded-2xl bg-slate-900 border border-slate-800 transition-all hover:bg-slate-800 hover:border-slate-700 hover:-translate-y-1"
          >
            <div className="p-4 rounded-full bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform">
              <UserRoundPen className="w-8 h-8" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold">Private Tutor</h2>
              <p className="mt-2 text-sm text-slate-400">
                For independent educators managing individual learners and sessions.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
