/**
 * Next.js Instrumentation Hook
 *
 * This file is loaded once per server process start (not per request).
 * It is the correct place to:
 * 1. Register the Sentry Node SDK (for server components / server actions).
 * 2. Log a startup banner so deployment pipelines have a clear "app started" marker.
 *
 * Next.js calls `register()` automatically when `instrumentation.ts` exists at
 * the project root and `experimental.instrumentationHook` is NOT required from
 * Next.js 14.0.4+ (it is enabled by default).
 *
 * Reference: https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // ── 1. Validate required environment variables ─────────────────────────
    // Runs before Sentry and the logger so a misconfigured deployment crashes
    // loudly at startup rather than serving broken pages.
    const { assertEnv } = await import("@/lib/env")
    assertEnv()

    // ── 2. Initialise Sentry server SDK ────────────────────────────────────
    await import("./sentry.server.config")

    // ── 3. Log startup banner ──────────────────────────────────────────────
    const { systemLogger } = await import("@/lib/logger")
    systemLogger.info(
      {
        nodeVersion: process.version,
        env: process.env.NODE_ENV,
        version: process.env.npm_package_version ?? "unknown",
      },
      "SchoolPay server started",
    )
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config")
  }
}

/**
 * onRequestError is called by Next.js for every unhandled server-side error.
 * Forwarding it to Sentry ensures we never miss an uncaught exception even if
 * the error boundary or try/catch is absent.
 */
export const onRequestError = async (
  err: unknown,
  request: Parameters<typeof import("@sentry/nextjs")["captureRequestError"]>[1],
  context: Parameters<typeof import("@sentry/nextjs")["captureRequestError"]>[2],
) => {
  const { captureRequestError } = await import("@sentry/nextjs")
  captureRequestError(err, request, context)
}
