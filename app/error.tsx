"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import * as Sentry from "@sentry/nextjs"

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Sentry captures the full exception with stack trace.
    // The digest ties this client error back to any matching server log.
    Sentry.captureException(error, { extra: { digest: error.digest } })
  }, [error])

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
      <div className="space-y-4 max-w-md">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Something went wrong</h2>
        <p className="text-muted-foreground">
          An unexpected error occurred. Our team has been notified automatically.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono bg-muted px-3 py-1.5 rounded-md inline-block">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex justify-center gap-3 pt-2">
          <Button onClick={() => reset()}>Try again</Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
