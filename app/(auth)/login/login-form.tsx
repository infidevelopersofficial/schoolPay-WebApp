"use client"

import { useActionState } from "react"
import { authenticate } from "./actions"
import { Loader2, AlertCircle } from "lucide-react"

export function LoginForm() {
  const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined)

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="login-email" className="block text-sm font-medium text-white/80">
          Email address
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          placeholder="admin@school.com"
          required
          autoComplete="email"
          autoFocus
          className="w-full h-11 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-4 text-white placeholder:text-white/40 outline-none transition-all duration-200 focus:bg-white/15 focus:border-white/40 focus:ring-2 focus:ring-white/20"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="login-password" className="block text-sm font-medium text-white/80">
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          autoComplete="current-password"
          minLength={6}
          className="w-full h-11 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-4 text-white placeholder:text-white/40 outline-none transition-all duration-200 focus:bg-white/15 focus:border-white/40 focus:ring-2 focus:ring-white/20"
        />
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-red-500/20 backdrop-blur-sm border border-red-400/30 p-3 text-sm text-red-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full h-11 rounded-xl bg-white text-primary font-semibold text-base transition-all duration-200 hover:bg-white/90 hover:shadow-lg hover:shadow-white/20 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign in
      </button>
    </form>
  )
}
