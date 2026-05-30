"use client"

import { useActionState } from "react"
import { requestPasswordReset } from "./actions"
import { Loader2, AlertCircle, KeyRound, CheckCircle2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const [stateMessage, formAction, isPending] = useActionState(requestPasswordReset, undefined)

  const isSuccess = stateMessage === "success"

  return (
    <div className="flex flex-col justify-center min-h-screen p-4 bg-slate-950 sm:p-8">
      <div className="w-full max-w-sm mx-auto space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-500 mb-2">
            <KeyRound className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Forgot Password</h1>
          <p className="text-slate-400 text-sm">
            Enter your email address and we&apos;ll send you a password recovery link.
          </p>
        </div>

        {isSuccess ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-white text-lg">Check your email</h3>
              <p className="text-slate-400 text-sm">
                If an account exists for that email, we have sent password reset instructions.
              </p>
            </div>
            <a
              href="/login-type-selector"
              className="inline-block w-full h-11 rounded-xl bg-white text-primary font-semibold text-base transition-all duration-200 hover:bg-white/90 flex items-center justify-center"
            >
              Back to Login
            </a>
          </div>
        ) : (
          <form action={formAction} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="reset-email" className="block text-sm font-medium text-white/80">
                Email address
              </label>
              <input
                id="reset-email"
                name="email"
                type="email"
                placeholder="admin@school.com"
                required
                autoComplete="email"
                autoFocus
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
              Send Reset Link
            </button>
          </form>
        )}

        {!isSuccess && (
          <div className="text-center text-sm text-slate-500">
            <a href="/login-type-selector" className="hover:text-slate-300 transition-colors">
              ← Back to organization selection
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
