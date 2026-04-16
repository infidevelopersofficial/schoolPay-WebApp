/**
 * Centralized Application Logger
 *
 * Uses Pino for high-performance JSON logging in production.
 * - Intercepts ERROR/FATAL levels and forwards them to Sentry APM.
 * - Exposes domain-specific child loggers (auth, payment, db, system) so log
 *   records carry a consistent `domain` field that Sentry/log aggregators can
 *   filter on.
 * - Provides a `withTiming` helper for manual performance spans.
 */
import pino from "pino"
import * as Sentry from "@sentry/nextjs"

// ─── Base logger ──────────────────────────────────────────────────────────────

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: { colorize: true, ignore: "pid,hostname" },
        }
      : undefined,
  base: {
    env: process.env.NODE_ENV,
    service: "schoolpay-web",
  },
  hooks: {
    logMethod(inputArgs, method, level) {
      // Auto-forward error / fatal records to Sentry so every logger.error()
      // call is automatically captured without requiring manual Sentry calls.
      if (level >= 50) {
        const hasContext = inputArgs.length > 1 && typeof inputArgs[0] === "object"
        const context = hasContext ? (inputArgs[0] as Record<string, unknown>) : {}
        const message = String(hasContext ? inputArgs[1] : inputArgs[0])

        // Capture the original Error object when present so Sentry preserves the stack.
        const originalError = context?.err instanceof Error ? context.err : undefined

        if (originalError) {
          Sentry.captureException(originalError, {
            level: level >= 60 ? "fatal" : "error",
            extra: { ...context },
          })
        } else {
          Sentry.captureMessage(message, {
            level: level >= 60 ? "fatal" : "error",
            extra: { ...context },
          })
        }
      }
      return method.apply(this, inputArgs as [unknown, string?, ...unknown[]])
    },
  },
})

// ─── Domain child loggers ─────────────────────────────────────────────────────
// Each child binds a `domain` field so every log line is filterable in any
// log aggregator (Datadog, Logtail, CloudWatch, etc.).

/** Authentication events: logins, failures, rate limits, session events. */
export const authLogger = logger.child({ domain: "auth" })

/** Payment lifecycle: creation, refunds, failures, amount anomalies. */
export const paymentLogger = logger.child({ domain: "payment" })

/** Database operations: slow queries, connection errors, transaction failures. */
export const dbLogger = logger.child({ domain: "db" })

/** System-level events: startup, health checks, config issues. */
export const systemLogger = logger.child({ domain: "system" })

// ─── Performance timing helper ────────────────────────────────────────────────

/**
 * Wraps an async operation, measures its wall-clock duration, and logs a
 * warning when it exceeds `thresholdMs`.
 *
 * @example
 * const result = await withTiming(
 *   "db.students.findMany",
 *   () => prisma.student.findMany(),
 *   { thresholdMs: 200, logger: dbLogger }
 * )
 */
export async function withTiming<T>(
  label: string,
  fn: () => Promise<T>,
  options: {
    thresholdMs?: number
    logger?: pino.Logger
    context?: Record<string, unknown>
  } = {},
): Promise<T> {
  const { thresholdMs = 500, logger: log = logger, context = {} } = options
  const start = performance.now()
  try {
    const result = await fn()
    const durationMs = Math.round(performance.now() - start)
    if (durationMs > thresholdMs) {
      log.warn({ label, durationMs, thresholdMs, ...context }, `Slow operation: ${label}`)
    }
    return result
  } catch (err) {
    const durationMs = Math.round(performance.now() - start)
    log.error({ label, durationMs, err, ...context }, `Operation failed: ${label}`)
    throw err
  }
}
