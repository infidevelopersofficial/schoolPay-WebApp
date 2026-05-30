"use client"

import { useActionState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { claimParentAccount } from "./actions"
import { Loader2, AlertCircle, Users, CheckCircle2, ShieldAlert } from "lucide-react"

function ParentClaimForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  const [stateMessage, formAction, isPending] = useActionState(claimParentAccount, undefined)
  const isSuccess = stateMessage === "success"

  if (!token) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center space-y-4">
        <div className="flex justify-center">
          <ShieldAlert className="h-12 w-12 text-red-400" />
        </div>
        <div className="space-y-2">
          <h3 className="font-bold text-white text-lg">Invalid Invitation</h3>
          <p className="text-slate-400 text-sm">
            No invitation token was provided. Please contact your school administrator.
          </p>
        </div>
        <a
          href="/login-type-selector"
          className="inline-block w-full h-11 rounded-xl bg-white text-primary font-semibold text-base transition-all duration-200 hover:bg-white/90 flex items-center justify-center"
        >
          Back to Login
        </a>
      </div>
    )
  }

  return (
    <>
      {isSuccess ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-white text-lg">Account Setup Complete!</h3>
            <p className="text-slate-400 text-sm">
              Your Parent Portal account is now active. You can sign in using your email and the password you just set.
            </p>
          </div>
          <a
            href="/login-type-selector"
            className="inline-block w-full h-11 rounded-xl bg-white text-primary font-semibold text-base transition-all duration-200 hover:bg-white/90 flex items-center justify-center"
          >
            Sign In to Portal
          </a>
        </div>
      ) : (
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="token" value={token} />

          <div className="space-y-2">
            <label htmlFor="setup-password" className="block text-sm font-medium text-white/80">
              Create Password
            </label>
            <input
              id="setup-password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              minLength={8}
              autoFocus
              className="w-full h-11 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-4 text-white placeholder:text-white/40 outline-none transition-all duration-200 focus:bg-white/15 focus:border-white/40 focus:ring-2 focus:ring-white/20"
            />
            <p className="text-slate-400 text-xs mt-1">
              Must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special symbol.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm-setup-password" className="block text-sm font-medium text-white/80">
              Confirm Password
            </label>
            <input
              id="confirm-setup-password"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              required
              minLength={8}
              className="w-full h-11 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-4 text-white placeholder:text-white/40 outline-none transition-all duration-200 focus:bg-white/15 focus:border-white/40 focus:ring-2 focus:ring-white/20"
            />
          </div>

          {stateMessage && stateMessage !== "success" && (
            <div className="flex items-center gap-2 rounded-xl bg-red-500/20 backdrop-blur-sm border border-red-400/30 p-3 text-sm text-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>{stateMessage}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full h-11 rounded-xl bg-white text-primary font-semibold text-base transition-all duration-200 hover:bg-white/90 hover:shadow-lg hover:shadow-white/20 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Claim Account
          </button>
        </form>
      )}
    </>
  )
}

export default function ParentClaimPage() {
  return (
    <div className="flex flex-col justify-center min-h-screen p-4 bg-slate-950 sm:p-8">
      <div className="w-full max-w-sm mx-auto space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-500 mb-2">
            <Users className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Setup Parent Account</h1>
          <p className="text-slate-400 text-sm">
            Activate your Parent Portal account and secure it with a new password.
          </p>
        </div>

        <Suspense fallback={
          <div className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        }>
          <ParentClaimForm />
        </Suspense>
      </div>
    </div>
  )
}
