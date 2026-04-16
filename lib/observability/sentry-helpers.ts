/**
 * Sentry Context Helpers
 *
 * Centralises all Sentry scope mutations so the rest of the codebase never
 * calls Sentry APIs directly for context-setting — only for actual error /
 * performance capture.  This keeps Sentry calls auditable and consistent.
 *
 * Provided helpers:
 * - setSentryUser          — attach user identity from a NextAuth session
 * - clearSentryUser        — wipe user context on sign-out
 * - setSentryPaymentCtx    — tag the active scope with payment metadata
 * - setSentryAuthCtx       — tag the active scope with auth event metadata
 * - addBreadcrumb          — typed breadcrumb factory
 * - capturePaymentError    — capture payment errors with full context
 * - captureAuthError       — capture auth errors with full context
 * - captureDbError         — capture DB errors with query metadata
 */

import * as Sentry from "@sentry/nextjs"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserContext {
  id: string
  email?: string | null
  role?: string
}

export interface PaymentContext {
  paymentId?: string
  studentId: string
  amount: number
  paymentMethod: string
  receiptNumber?: string
}

export interface AuthContext {
  email: string
  event: "login_attempt" | "login_success" | "login_failed" | "rate_limited" | "sign_out"
  remainingAttempts?: number
}

// ─── User identity ─────────────────────────────────────────────────────────

/**
 * Attach the authenticated user to the active Sentry scope.
 * Call this once per request after session resolution.
 */
export function setSentryUser(user: UserContext): void {
  Sentry.setUser({
    id: user.id,
    email: user.email ?? undefined,
    // Store role as a tag so it is searchable in Sentry issue lists.
    username: user.role ? `[${user.role}] ${user.email}` : user.email ?? user.id,
  })
  Sentry.setTag("user.role", user.role ?? "unknown")
}

/** Clear user identity (call on sign-out). */
export function clearSentryUser(): void {
  Sentry.setUser(null)
}

// ─── Payment context ──────────────────────────────────────────────────────────

/**
 * Enrich the Sentry scope with payment metadata.
 * Attach this before any payment operation so that any error captured in the
 * same async scope automatically carries payment context.
 */
export function setSentryPaymentCtx(ctx: PaymentContext): void {
  Sentry.setContext("payment", {
    studentId: ctx.studentId,
    amount: ctx.amount,
    paymentMethod: ctx.paymentMethod,
    receiptNumber: ctx.receiptNumber,
  })
  Sentry.setTag("payment.method", ctx.paymentMethod)
  if (ctx.paymentId) Sentry.setTag("payment.id", ctx.paymentId)
}

// ─── Auth context ─────────────────────────────────────────────────────────────

/** Enrich the Sentry scope with an auth-event tag. */
export function setSentryAuthCtx(ctx: AuthContext): void {
  Sentry.setContext("auth", {
    email: ctx.email,
    event: ctx.event,
    remainingAttempts: ctx.remainingAttempts,
  })
  Sentry.setTag("auth.event", ctx.event)
}

// ─── Typed breadcrumbs ────────────────────────────────────────────────────────

type BreadcrumbCategory = "auth" | "payment" | "navigation" | "db" | "http" | "user" | "system"

/**
 * Add a structured breadcrumb to the active Sentry scope.
 *
 * @example
 * addBreadcrumb("payment", "Payment created", { amount: 1500, method: "UPI" })
 */
export function addBreadcrumb(
  category: BreadcrumbCategory,
  message: string,
  data?: Record<string, unknown>,
  level: Sentry.SeverityLevel = "info",
): void {
  Sentry.addBreadcrumb({ category, message, data, level, timestamp: Date.now() / 1000 })
}

// ─── Domain-specific error capture ───────────────────────────────────────────

/**
 * Capture a payment-related error with full context attached.
 * Returns the Sentry event ID for correlation with logs.
 */
export function capturePaymentError(
  err: unknown,
  ctx: PaymentContext & { operation: string },
): string {
  setSentryPaymentCtx(ctx)
  addBreadcrumb("payment", `Payment ${ctx.operation} failed`, {
    studentId: ctx.studentId,
    amount: ctx.amount,
    method: ctx.paymentMethod,
  }, "error")

  return Sentry.captureException(err, {
    tags: {
      "payment.operation": ctx.operation,
      "payment.method": ctx.paymentMethod,
    },
    extra: {
      studentId: ctx.studentId,
      amount: ctx.amount,
      receiptNumber: ctx.receiptNumber,
    },
  })
}

/**
 * Capture an auth-related error (failed logins, session errors, etc.).
 */
export function captureAuthError(err: unknown, ctx: AuthContext): string {
  setSentryAuthCtx(ctx)
  addBreadcrumb("auth", `Auth error: ${ctx.event}`, { email: ctx.email }, "error")

  return Sentry.captureException(err, {
    tags: { "auth.event": ctx.event },
    extra: { email: ctx.email, remainingAttempts: ctx.remainingAttempts },
  })
}

/**
 * Capture a database error with query metadata.
 * Avoid passing full query parameter values to prevent PII leakage.
 */
export function captureDbError(
  err: unknown,
  ctx: { operation: string; model?: string; durationMs?: number },
): string {
  addBreadcrumb("db", `DB error on ${ctx.model ?? "unknown"}.${ctx.operation}`, {
    model: ctx.model,
    operation: ctx.operation,
    durationMs: ctx.durationMs,
  }, "error")

  return Sentry.captureException(err, {
    tags: {
      "db.operation": ctx.operation,
      "db.model": ctx.model ?? "unknown",
    },
    extra: { durationMs: ctx.durationMs },
  })
}
