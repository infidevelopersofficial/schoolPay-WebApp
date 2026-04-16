/**
 * DAL Utility — withDAL
 *
 * A thin wrapper applied to every DAL mutation that provides three guarantees:
 *
 * 1. **Error classification** — Prisma error codes are translated into
 *    user-facing messages (P2002 → "already exists", P2025 → "not found", …)
 *    and the raw Prisma error class is mapped to a structured log record.
 *
 * 2. **Structured logging** — every failure is logged at `error` level with
 *    `label`, `prismaCode`, and the original error object.  The logger hook
 *    in `lib/logger.ts` automatically forwards error-level records to Sentry.
 *
 * 3. **Performance tracking** — wraps the operation with `measureAsync` so
 *    slow mutations surface in Sentry performance dashboards and Pino logs.
 *
 * Usage:
 *   return withDAL("students.create", () => prisma.student.create(...), {
 *     log: logger.child({ domain: "students" }),
 *     thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY,
 *   })
 */

import { Prisma } from "@prisma/client"
import type pino from "pino"
import { logger as rootLogger } from "@/lib/logger"
import { measureAsync, THRESHOLDS } from "@/lib/observability/performance"

// ─── User-facing translations for known Prisma error codes ───────────────────
// https://www.prisma.io/docs/orm/reference/error-reference

const PRISMA_MESSAGES: Record<string, string> = {
  P2002: "A record with this information already exists.",
  P2003: "This action references a related record that does not exist.",
  P2014: "This change would violate a required relationship.",
  P2025: "Record not found.",
  P2034: "A write conflict occurred — please retry the operation.",
}

// ─── DALError ─────────────────────────────────────────────────────────────────

/**
 * Thrown by `withDAL` when a Prisma operation fails.
 * `message` is safe to show the user.
 * `cause` carries the original error for server-side logging.
 * `prismaCode` is set when the failure is a known Prisma error.
 */
export class DALError extends Error {
  constructor(
    message: string,
    public readonly cause: unknown,
    public readonly prismaCode?: string,
  ) {
    super(message)
    this.name = "DALError"
  }
}

// ─── withDAL ──────────────────────────────────────────────────────────────────

export interface WithDALOptions {
  /** Child logger to use (e.g. `dbLogger`, `paymentLogger`). Defaults to root logger. */
  log?: pino.Logger
  /** Slow-operation threshold in ms. Defaults to `THRESHOLDS.DB_SIMPLE_QUERY`. */
  thresholdMs?: number
  /** Sentry span operation string. Defaults to `"db.query"`. */
  sentryOp?: string
}

/**
 * Wraps an async DAL operation with error handling, classification, logging,
 * and performance measurement.
 *
 * @param label  Short dot-notation label used in logs and Sentry spans.
 *               Convention: `"{entity}.{operation}"` e.g. `"students.create"`.
 * @param fn     The async operation to execute.
 * @param opts   Optional overrides for logger, thresholds, and Sentry op.
 *
 * On failure:
 * - Prisma known errors → translated to `DALError` with a user-safe message
 * - Prisma init errors  → translated to "Database connection failed"
 * - Prisma validation   → translated to "Invalid data provided"
 * - Unknown errors      → re-thrown as-is (already captured by Sentry via logger)
 */
export async function withDAL<T>(
  label: string,
  fn: () => Promise<T>,
  opts: WithDALOptions = {},
): Promise<T> {
  const {
    log = rootLogger,
    thresholdMs = THRESHOLDS.DB_SIMPLE_QUERY,
    sentryOp = "db.query",
  } = opts

  return measureAsync(
    label,
    async () => {
      try {
        return await fn()
      } catch (err) {
        // ── Classify the error ───────────────────────────────────────────────
        let userMessage = "An unexpected error occurred. Please try again."
        let prismaCode: string | undefined

        if (err instanceof Prisma.PrismaClientKnownRequestError) {
          prismaCode = err.code
          userMessage = PRISMA_MESSAGES[err.code] ?? `Database error (${err.code}).`
          log.error(
            { err, label, prismaCode, meta: err.meta },
            `Prisma known error in ${label}`,
          )
        } else if (err instanceof Prisma.PrismaClientInitializationError) {
          userMessage = "Database connection failed. Please try again later."
          log.error({ err, label }, `Prisma initialisation error in ${label}`)
        } else if (err instanceof Prisma.PrismaClientValidationError) {
          userMessage = "Invalid data provided."
          log.error({ err, label }, `Prisma validation error in ${label}`)
        } else if (err instanceof Prisma.PrismaClientUnknownRequestError) {
          log.error({ err, label }, `Prisma unknown request error in ${label}`)
        } else {
          // Non-Prisma error — re-throw without wrapping so the original stack
          // is preserved.  The `measureAsync` wrapper will log it.
          throw err
        }

        throw new DALError(userMessage, err, prismaCode)
      }
    },
    { sentryOp, domain: "db", thresholdMs },
  )
}
