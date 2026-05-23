"use client"

import { useState } from "react"
import { activateStudentAccount } from "./actions"
import { Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ActivationForm({ hasDob }: { hasDob: boolean }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const result = await activateStudentAccount(formData)
    
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
    // If successful, the server action calls signOut({ redirectTo }) and navigates away
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {hasDob && (
        <div className="space-y-2">
          <label htmlFor="dob" className="block text-sm font-medium text-slate-300">
            Date of Birth (Verification)
          </label>
          <input
            id="dob"
            name="dob"
            type="date"
            required
            className="w-full h-11 rounded-xl bg-slate-950 border border-slate-800 px-4 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <p className="text-xs text-slate-500">Must match school records.</p>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-slate-300">
          New Permanent Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="••••••••"
          className="w-full h-11 rounded-xl bg-slate-950 border border-slate-800 px-4 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <p className="text-xs text-slate-500">Must be at least 8 characters.</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          placeholder="••••••••"
          className="w-full h-11 rounded-xl bg-slate-950 border border-slate-800 px-4 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Activate Account
      </Button>
    </form>
  )
}
