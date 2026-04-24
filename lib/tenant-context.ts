/**
 * Tenant Context — Server-Side School Resolution
 *
 * Extracts the active `schoolId` from the current user's JWT session.
 * Every DAL function calls `getSchoolId()` to scope queries to the
 * correct tenant. Uses React.cache() to deduplicate auth() calls
 * within the same server-component render tree.
 *
 * Throws `TenantError` when no school is selected — this triggers
 * the school-selector redirect via the auth middleware.
 */

import { auth } from "@/lib/auth"
import { cache } from "react"

// ─── TenantError ──────────────────────────────────────────────────────────────

/**
 * Thrown when a tenant-scoped operation is attempted without an active school.
 * The middleware layer catches this and redirects to `/select-school`.
 */
export class TenantError extends Error {
  constructor(message = "No active school selected") {
    super(message)
    this.name = "TenantError"
  }
}

// ─── getSchoolId ──────────────────────────────────────────────────────────────

/**
 * Returns the active `schoolId` from the current JWT session.
 *
 * Cached per-request via `React.cache()` so multiple DAL calls in the same
 * server-component render don't invoke `auth()` repeatedly.
 *
 * @throws {TenantError} if the user has no active school selected.
 */
export const getSchoolId = cache(async (): Promise<string> => {
  const session = await auth()
  const schoolId = (session?.user as any)?.activeSchoolId as string | undefined

  if (!schoolId) {
    throw new TenantError()
  }

  return schoolId
})

// ─── getOptionalSchoolId ──────────────────────────────────────────────────────

/**
 * Returns the active `schoolId` or `null`.
 *
 * Used in contexts where tenant scoping is optional — e.g. SUPER_ADMIN
 * cross-tenant views, or audit logging where the school may not be set yet.
 */
export const getOptionalSchoolId = cache(async (): Promise<string | null> => {
  const session = await auth()
  return ((session?.user as any)?.activeSchoolId as string) ?? null
})
