"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { executeEmailVerification } from "./actions"
import { Loader2, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react"

function VerifyEmailForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("Verifying your email address...")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("No verification token was provided.")
      return
    }

    let isSubscribed = true

    executeEmailVerification(token)
      .then(res => {
        if (!isSubscribed) return
        if (res.success) {
          setStatus("success")
          setMessage(res.message)
        } else {
          setStatus("error")
          setMessage(res.message)
        }
      })
      .catch(err => {
        if (!isSubscribed) return
        setStatus("error")
        setMessage("An unexpected error occurred. Please try again.")
      })

    return () => {
      isSubscribed = false
    }
  }, [token])

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-8">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
        <p className="text-slate-400 text-sm">{message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {status === "success" ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-white text-lg">Email Verified</h3>
            <p className="text-slate-400 text-sm">{message}</p>
          </div>
          <a
            href="/login-type-selector"
            className="inline-block w-full h-11 rounded-xl bg-white text-primary font-semibold text-base transition-all duration-200 hover:bg-white/90 flex items-center justify-center"
          >
            Sign In
          </a>
        </div>
      ) : (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center space-y-4">
          <div className="flex justify-center">
            <ShieldAlert className="h-12 w-12 text-red-400" />
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-white text-lg">Verification Failed</h3>
            <p className="text-slate-400 text-sm">{message}</p>
          </div>
          <a
            href="/login-type-selector"
            className="inline-block w-full h-11 rounded-xl bg-white text-primary font-semibold text-base transition-all duration-200 hover:bg-white/90 flex items-center justify-center"
          >
            Back to Login
          </a>
        </div>
      )}
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="flex flex-col justify-center min-h-screen p-4 bg-slate-950 sm:p-8">
      <div className="w-full max-w-sm mx-auto space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-500 mb-2">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Email Verification</h1>
          <p className="text-slate-400 text-sm">
            SchoolPay Email Verification Service.
          </p>
        </div>

        <Suspense fallback={
          <div className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        }>
          <VerifyEmailForm />
        </Suspense>
      </div>
    </div>
  )
}
