"use client"

import { useEffect } from "react"
import { ShieldAlert, AlertCircle } from "lucide-react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error(error)
  }, [error])

  const isUnauthorized =
    error.name === "UnauthorizedFeatureError" || error.name === "UnauthorizedRoleError"

  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm mt-8 mx-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 mb-6 shadow-inner">
        {isUnauthorized ? <ShieldAlert size={40} /> : <AlertCircle size={40} />}
      </div>
      <h2 className="mb-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        {isUnauthorized ? "Access Denied" : "Something went wrong"}
      </h2>
      <p className="mb-8 max-w-md text-zinc-600 dark:text-zinc-400">
        {isUnauthorized
          ? error.message || "You do not have permission to access this feature."
          : "An unexpected error occurred while loading this dashboard."}
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Try again
        </button>
        <button
          onClick={() => (window.location.href = "/")}
          className="rounded-full border border-zinc-200 bg-white px-6 py-2.5 text-sm font-medium text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
        >
          Go to Home
        </button>
      </div>
    </div>
  )
}
