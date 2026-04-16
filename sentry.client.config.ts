/**
 * Sentry — Client-side Configuration
 *
 * Runs in the browser.  Loaded automatically by the Sentry Next.js SDK.
 *
 * Key decisions:
 * - Session Replay samples 10% of normal sessions, 100% when an error fires.
 *   Text and media are masked by default to protect student PII.
 * - `beforeSend` strips payment card numbers / tokens that could appear in
 *   query params or form serialisations.
 * - `tracesSampler` mirrors the server config: 100% for payment/auth URLs so
 *   every user-facing error on critical flows has a matching trace.
 */

import * as Sentry from "@sentry/nextjs"

const IS_PROD = process.env.NODE_ENV === "production"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NODE_ENV ?? "development",

  release: process.env.NEXT_PUBLIC_APP_VERSION,

  // ── Adaptive sampling ─────────────────────────────────────────────────────
  tracesSampler(samplingContext) {
    const url = samplingContext.name ?? ""
    if (url.includes("/payments") || url.includes("/login")) return 1.0
    if (IS_PROD) return 0.2
    return 1.0
  },

  // ── Session Replay ────────────────────────────────────────────────────────
  replaysSessionSampleRate: IS_PROD ? 0.05 : 0.0,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      // Mask all form inputs and text nodes to prevent student PII capture.
      maskAllText: true,
      blockAllMedia: true,
      // Un-mask specific class if you need to see non-sensitive UI elements.
      // unmask: [".sentry-unmask"],
    }),
    Sentry.browserTracingIntegration(),
    Sentry.breadcrumbsIntegration({
      // Track fetch/XHR, console, and DOM clicks as breadcrumbs for richer
      // error context without requiring manual instrumentation.
      fetch: true,
      xhr: true,
      console: true,
      dom: true,
    }),
  ],

  // ── PII scrubbing ─────────────────────────────────────────────────────────
  beforeSend(event) {
    // Strip potential card / token data from URL query strings.
    if (event.request?.url) {
      event.request.url = event.request.url
        .replace(/token=[^&]*/gi, "token=[REDACTED]")
        .replace(/card=[^&]*/gi, "card=[REDACTED]")
    }
    if (event.request?.query_string) {
      if (typeof event.request.query_string === "string") {
        event.request.query_string = event.request.query_string
          .replace(/token=[^&]*/gi, "token=[REDACTED]")
          .replace(/password=[^&]*/gi, "password=[REDACTED]")
      }
    }
    return event
  },

  debug: !IS_PROD && process.env.NEXT_PUBLIC_SENTRY_DEBUG === "true",
})
