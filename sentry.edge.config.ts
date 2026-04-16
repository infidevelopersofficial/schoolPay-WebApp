/**
 * Sentry — Edge Runtime Configuration
 *
 * Runs in the Next.js Edge runtime (middleware, edge route handlers).
 * The Edge runtime has no access to Node.js APIs so this config is minimal —
 * no Prisma integration, no process.memoryUsage, etc.
 */

import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NODE_ENV ?? "development",

  release: process.env.SENTRY_RELEASE,

  // Keep edge tracing lean — middleware runs on every request.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 0.5,

  debug: false,
})
