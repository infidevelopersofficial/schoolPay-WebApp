/**
 * Tenant Context — Server-Side School Resolution
 *
 * Phase 2: Now carries tenantType, planTier, and parentId (for PARENT role sessions)
 * in addition to schoolId and schoolRole.
 *
 * Uses React.cache() to deduplicate auth() calls within the same
 * server-component render tree.
 *
 * Throws `TenantError` when no school is selected — triggers
 * the school-selector redirect via the auth middleware.
 */

import { auth } from "@/lib/auth"
import { cache } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TenantContext {
  schoolId: string
  schoolRole: string | null
  tenantType: string       // "SCHOOL" | "COACHING_CENTER" | "PRIVATE_TUTOR"
  planTier: string         // "FREE" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE"
  parentId: string | null  // populated when schoolRole === "PARENT"
}

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

// ─── getTenantContext ─────────────────────────────────────────────────────────

/**
 * Returns the full tenant context from the current JWT session.
 * Cached per-request via `React.cache()`.
 *
 * @throws {TenantError} if the user has no active school selected.
 */
export const getTenantContext = cache(async (): Promise<TenantContext> => {
  const session = await auth()
  const user = session?.user as any

  const schoolId = user?.activeSchoolId as string | undefined
  if (!schoolId) throw new TenantError()

  return {
    schoolId,
    schoolRole: (user?.schoolRole as string) ?? null,
    tenantType: (user?.tenantType as string) ?? "SCHOOL",
    planTier: (user?.planTier as string) ?? "FREE",
    parentId: (user?.parentId as string) ?? null,
  }
})

// ─── getSchoolId ──────────────────────────────────────────────────────────────

/**
 * Returns only the active `schoolId`. Convenience wrapper for DAL functions.
 * @throws {TenantError} if the user has no active school selected.
 */
export const getSchoolId = cache(async (): Promise<string> => {
  const { schoolId } = await getTenantContext()
  return schoolId
})

// ─── getOptionalSchoolId ──────────────────────────────────────────────────────

/**
 * Returns the active `schoolId` or `null`.
 * Used in contexts where tenant scoping is optional (SUPER_ADMIN cross-tenant views).
 */
export const getOptionalSchoolId = cache(async (): Promise<string | null> => {
  const session = await auth()
  return ((session?.user as any)?.activeSchoolId as string) ?? null
})

// ─── getParentContext ─────────────────────────────────────────────────────────

/**
 * Returns { schoolId, parentId, childrenIds } for parent portal DAL functions.
 * Throws if the current session is not a PARENT role.
 */
export const getParentContext = cache(async () => {
  const ctx = await getTenantContext()
  if (ctx.schoolRole !== "PARENT") {
    throw new Error("Access denied: parent portal only")
  }
  if (!ctx.parentId) {
    throw new Error("Parent profile not linked to this account")
  }
  return {
    schoolId: ctx.schoolId,
    parentId: ctx.parentId,
  }
})
