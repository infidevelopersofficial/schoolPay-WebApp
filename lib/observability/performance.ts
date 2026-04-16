/**
 * Performance Monitoring
 *
 * Provides:
 * - `THRESHOLDS` — configurable latency budgets per operation category
 * - `measureAsync` — wraps an async fn with timing, slow-log warning, and an
 *    optional Sentry performance span
 * - `createSentrySpan` — thin helper to open/close a named Sentry span
 *
 * All helpers are no-ops when Sentry is not configured, so they are safe to
 * use in environments without a DSN.
 */

import * as Sentry from "@sentry/nextjs"
import { dbLogger, paymentLogger, authLogger, systemLogger, logger } from "@/lib/logger"
import type pino from "pino"

// ─── Latency budgets (milliseconds) ──────────────────────────────────────────

export const THRESHOLDS = {
  /** Simple SELECT queries without heavy joins. */
  DB_SIMPLE_QUERY: Number(process.env.PERF_THRESHOLD_DB_SIMPLE ?? 150),
  /** Complex queries with joins, aggregations, or large result sets. */
  DB_COMPLEX_QUERY: Number(process.env.PERF_THRESHOLD_DB_COMPLEX ?? 500),
  /** Entire payment creation / refund transaction. */
  PAYMENT_TRANSACTION: Number(process.env.PERF_THRESHOLD_PAYMENT ?? 2_000),
  /** Authentication (password hash + DB lookup). */
  AUTH_LOGIN: Number(process.env.PERF_THRESHOLD_AUTH ?? 800),
  /** Any outbound API or third-party HTTP call. */
  EXTERNAL_API: Number(process.env.PERF_THRESHOLD_EXTERNAL_API ?? 3_000),
  /** Generic server action response budget. */
  SERVER_ACTION: Number(process.env.PERF_THRESHOLD_SERVER_ACTION ?? 1_000),
} as const

export type ThresholdKey = keyof typeof THRESHOLDS

// ─── Domain → logger mapping ──────────────────────────────────────────────────

const DOMAIN_LOGGER: Record<string, pino.Logger> = {
  db: dbLogger,
  payment: paymentLogger,
  auth: authLogger,
  system: systemLogger,
}

function resolveLogger(domain?: string): pino.Logger {
  return domain ? (DOMAIN_LOGGER[domain] ?? logger) : logger
}

// ─── measureAsync ─────────────────────────────────────────────────────────────

export interface MeasureOptions<C extends Record<string, unknown> = Record<string, unknown>> {
  /**
   * Sentry span operation name (e.g. "db.query", "payment.create").
   * If omitted, no Sentry span is created.
   */
  sentryOp?: string
  /** Log domain used to select the child logger. */
  domain?: string
  /** Latency budget in milliseconds. Logs a warning when exceeded. */
  thresholdMs?: number
  /** Extra key/values merged into every log record for this call. */
  context?: C
}

/**
 * Wraps an async operation with:
 * 1. Wall-clock timing
 * 2. Slow-threshold warning log
 * 3. Optional Sentry performance span
 * 4. Structured error log on failure (re-throws the error)
 *
 * @example
 * const payments = await measureAsync(
 *   "payments.getAll",
 *   () => prisma.payment.findMany(),
 *   { sentryOp: "db.query", domain: "db", thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY }
 * )
 */
export async function measureAsync<T>(
  label: string,
  fn: () => Promise<T>,
  options: MeasureOptions = {},
): Promise<T> {
  const { sentryOp, domain, thresholdMs = THRESHOLDS.SERVER_ACTION, context = {} } = options
  const log = resolveLogger(domain)
  const start = performance.now()

  const run = async (): Promise<T> => {
    try {
      const result = await fn()
      const durationMs = Math.round(performance.now() - start)
      if (durationMs > thresholdMs) {
        log.warn({ label, durationMs, thresholdMs, ...context }, `Slow operation detected: ${label}`)
        // Surface to Sentry as a measurement so it shows in performance dashboards.
        Sentry.setMeasurement(label.replace(/\./g, "_"), durationMs, "millisecond")
      }
      return result
    } catch (err) {
      const durationMs = Math.round(performance.now() - start)
      log.error({ label, durationMs, err, ...context }, `Operation failed: ${label}`)
      throw err
    }
  }

  if (!sentryOp) return run()

  return Sentry.startSpan({ name: label, op: sentryOp }, run)
}

// ─── createSentrySpan ─────────────────────────────────────────────────────────

/**
 * Convenience wrapper around `Sentry.startSpan` for cases where you need
 * explicit span control outside of `measureAsync`.
 *
 * @example
 * const result = await createSentrySpan("auth.bcrypt", "auth.crypto", () => bcrypt.compare(...))
 */
export function createSentrySpan<T>(
  name: string,
  op: string,
  fn: () => Promise<T>,
): Promise<T> {
  return Sentry.startSpan({ name, op }, fn)
}
