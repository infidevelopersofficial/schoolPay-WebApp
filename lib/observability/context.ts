/**
 * Request Context — AsyncLocalStorage
 *
 * Carries a lightweight context object through the async call-stack so that
 * every logger call, Sentry scope mutation, or DB query executed during a
 * single request automatically carries the same requestId, userId, and role
 * without passing them through every function signature.
 *
 * Usage (e.g., in a Server Action or route handler):
 *
 *   import { runWithContext, newRequestContext } from "@/lib/observability/context"
 *
 *   const ctx = newRequestContext({ userId: session.user.id, userEmail: session.user.email })
 *   return runWithContext(ctx, () => someDALFunction())
 */

import { AsyncLocalStorage } from "async_hooks"

export interface RequestContext {
  /** Unique identifier for this request / server action invocation. */
  requestId: string
  /** Authenticated user id (undefined for unauthenticated paths). */
  userId?: string
  /** Authenticated user email. */
  userEmail?: string
  /** Role from the JWT session. */
  userRole?: string
  /** Wall-clock timestamp when the context was created. */
  startedAt: number
}

const storage = new AsyncLocalStorage<RequestContext>()

/**
 * Create a new context object, generating a requestId if not provided.
 */
export function newRequestContext(
  partial: Partial<Omit<RequestContext, "requestId" | "startedAt">> & { requestId?: string },
): RequestContext {
  return {
    requestId: partial.requestId ?? crypto.randomUUID(),
    startedAt: Date.now(),
    ...partial,
  }
}

/**
 * Run `fn` with the given context bound to the current async execution scope.
 * All code called transitively from `fn` (including await chains) will see the
 * same context via `getRequestContext()`.
 */
export function runWithContext<T>(ctx: RequestContext, fn: () => T): T {
  return storage.run(ctx, fn)
}

/**
 * Retrieve the current request context, or `undefined` when called outside a
 * `runWithContext` scope (e.g., during module init or background jobs).
 */
export function getRequestContext(): RequestContext | undefined {
  return storage.getStore()
}
