"use client"

import { logger } from "@/lib/logger"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import * as Sentry from "@sentry/nextjs"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.fatal({ err: error, digest: error.digest }, "Catastrophic global error caught")
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 p-4 text-center">
          <div className="space-y-4 max-w-md">
            <h1 className="text-4xl font-extrabold text-red-600">500</h1>
            <h2 className="text-2xl font-bold tracking-tight">System Error</h2>
            <p className="text-gray-500">
              A critical system error occurred. We are working on fixing it.
            </p>
            <button
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              onClick={() => reset()}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
