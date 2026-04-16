/**
 * Sentry — Server-side Configuration
 *
 * This file runs in the Node.js runtime (server components, server actions,
 * route handlers, API routes).  It is loaded automatically by the Sentry
 * Next.js SDK via the `withSentryConfig` Next.js plugin.
 *
 * Key decisions:
 * - `tracesSampler` provides adaptive sampling: 100% for payment/auth paths,
 *   lower rates for routine reads, to stay within the Sentry quota while
 *   keeping full fidelity on critical flows.
 * - `beforeSend` scrubs PII from error payloads before they leave the server.
 * - `integrations` enable Prisma and HTTP tracing out of the box.
 */

import * as Sentry from "@sentry/nextjs"

const IS_PROD = process.env.NODE_ENV === "production"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NODE_ENV ?? "development",

  release: process.env.SENTRY_RELEASE ?? process.env.npm_package_version,

  // ── Adaptive sampling ─────────────────────────────────────────────────────
  // Use a function instead of a flat rate so critical paths are always traced.
  tracesSampler(samplingContext) {
    const name = samplingContext.name ?? ""
    // Always trace payment and auth operations.
    if (name.includes("payment") || name.includes("auth") || name.includes("login")) return 1.0
    // Always trace health checks (lightweight, useful for uptime alerting).
    if (name.includes("/api/health")) return 1.0
    // Sample 50% of other server actions / API routes in production.
    if (IS_PROD) return 0.3
    // Full sampling in development.
    return 1.0
  },

  // ── PII scrubbing ─────────────────────────────────────────────────────────
  // Strip sensitive fields from every error event before it is sent to Sentry.
  beforeSend(event) {
    // Remove hashed passwords that might leak via Prisma validation errors.
    if (event.extra) {
      delete event.extra["hashedPassword"]
      delete event.extra["password"]
    }
    // Scrub request body fields.
    if (event.request?.data && typeof event.request.data === "object") {
      const data = event.request.data as Record<string, unknown>
      delete data["password"]
      delete data["hashedPassword"]
      delete data["token"]
    }
    return event
  },

  // ── Performance integrations ──────────────────────────────────────────────
  integrations: [
    // Automatically capture Prisma query spans (available in @sentry/nextjs >= 8).
    Sentry.prismaIntegration(),
  ],

  // Log Sentry SDK debug output only in development.
  debug: !IS_PROD && process.env.SENTRY_DEBUG === "true",
})
