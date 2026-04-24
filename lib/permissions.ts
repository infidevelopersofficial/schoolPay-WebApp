/**
 * Permissions — RBAC Matrix
 *
 * Defines what each role can do on each resource within a tenant.
 * Used by server actions, API routes, and UI components to gate access.
 *
 * Resolution order: TenantType → Role → Resource → Action
 *
 * Usage:
 *   import { can } from "@/lib/permissions"
 *   if (!can(session.user.schoolRole, "payments", "write")) throw new Error("Forbidden")
 */

export type Action = "read" | "write" | "delete" | "manage"

export type Resource =
  | "students"
  | "teachers"
  | "parents"
  | "classes"
  | "batches"
  | "subjects"
  | "fees"
  | "payments"
  | "invoices"
  | "results"
  | "attendance"
  | "exams"
  | "lessons"
  | "events"
  | "messages"
  | "announcements"
  | "settings"
  | "reports"
  | "audit"

// ─── Permission Matrix ──────────────────────────────────────────────────────
// Each role gets an array of allowed actions per resource.
// "manage" implies all actions (read + write + delete).

const PERMISSIONS: Record<string, Partial<Record<Resource, Action[]>>> = {
  // ── Platform level ──────────────────────────────────────────────────────
  SUPER_ADMIN: {
    students:      ["read", "write", "delete", "manage"],
    teachers:      ["read", "write", "delete", "manage"],
    parents:       ["read", "write", "delete", "manage"],
    classes:       ["read", "write", "delete", "manage"],
    batches:       ["read", "write", "delete", "manage"],
    subjects:      ["read", "write", "delete", "manage"],
    fees:          ["read", "write", "delete", "manage"],
    payments:      ["read", "write", "delete", "manage"],
    invoices:      ["read", "write", "delete", "manage"],
    results:       ["read", "write", "delete", "manage"],
    attendance:    ["read", "write", "delete", "manage"],
    exams:         ["read", "write", "delete", "manage"],
    lessons:       ["read", "write", "delete", "manage"],
    events:        ["read", "write", "delete", "manage"],
    messages:      ["read", "write", "delete", "manage"],
    announcements: ["read", "write", "delete", "manage"],
    settings:      ["read", "write", "delete", "manage"],
    reports:       ["read", "manage"],
    audit:         ["read", "manage"],
  },

  // ── School / Admin roles ─────────────────────────────────────────────────
  ADMIN: {
    students:      ["read", "write", "delete", "manage"],
    teachers:      ["read", "write", "delete", "manage"],
    parents:       ["read", "write", "delete", "manage"],
    classes:       ["read", "write", "delete", "manage"],
    batches:       ["read", "write", "delete", "manage"],
    subjects:      ["read", "write", "delete", "manage"],
    fees:          ["read", "write", "delete", "manage"],
    payments:      ["read", "write", "delete", "manage"],
    invoices:      ["read", "write", "delete", "manage"],
    results:       ["read", "write", "delete", "manage"],
    attendance:    ["read", "write", "delete", "manage"],
    exams:         ["read", "write", "delete", "manage"],
    lessons:       ["read", "write", "delete", "manage"],
    events:        ["read", "write", "delete", "manage"],
    messages:      ["read", "write", "delete", "manage"],
    announcements: ["read", "write", "delete", "manage"],
    settings:      ["read", "write", "manage"],
    reports:       ["read", "manage"],
    audit:         ["read"],
  },

  TEACHER: {
    students:      ["read"],
    teachers:      ["read"],
    parents:       ["read"],
    classes:       ["read"],
    batches:       ["read"],
    subjects:      ["read"],
    fees:          ["read"],
    payments:      ["read"],
    results:       ["read", "write"],
    attendance:    ["read", "write"],
    exams:         ["read", "write"],
    lessons:       ["read", "write"],
    events:        ["read"],
    messages:      ["read", "write"],
    announcements: ["read"],
    reports:       ["read"],
  },

  // ── Parent / Guardian (read-only portal + fee payment) ───────────────────
  PARENT: {
    students:      ["read"],   // own children only (enforced in parent portal DAL)
    fees:          ["read"],
    payments:      ["read", "write"], // write = can initiate a payment
    invoices:      ["read", "write"], // write = can pay an invoice
    results:       ["read"],
    attendance:    ["read"],
    events:        ["read"],
    messages:      ["read", "write"],
    announcements: ["read"],
  },

  // ── Student (self-service, read-only) ────────────────────────────────────
  STUDENT: {
    results:       ["read"],
    attendance:    ["read"],
    events:        ["read"],
    announcements: ["read"],
    fees:          ["read"],
    invoices:      ["read"],
  },
}

// ─── can() ─────────────────────────────────────────────────────────────────

/**
 * Returns true if the given role is permitted to perform `action` on `resource`.
 *
 * @param role     The user's current tenant role (from session.user.schoolRole)
 * @param resource The resource being accessed
 * @param action   The action being performed
 *
 * @example
 *   if (!can("TEACHER", "students", "delete")) throw new Error("Forbidden")
 */
export function can(
  role: string | undefined | null,
  resource: Resource,
  action: Action,
): boolean {
  if (!role) return false
  const allowed = PERMISSIONS[role]?.[resource]
  if (!allowed) return false
  return allowed.includes(action) || allowed.includes("manage")
}

/**
 * Returns true if the given role has ANY permission on the resource.
 * Useful for showing/hiding nav items.
 */
export function canAccess(role: string | undefined | null, resource: Resource): boolean {
  if (!role) return false
  return !!PERMISSIONS[role]?.[resource]
}

/**
 * Assert permission — throws a formatted error if not permitted.
 * Use in Server Actions and Route Handlers.
 *
 * @throws {Error} with status 403 message if permission denied
 */
export function assertCan(
  role: string | undefined | null,
  resource: Resource,
  action: Action,
): void {
  if (!can(role, resource, action)) {
    throw new Error(
      `Forbidden: role "${role ?? "unknown"}" cannot perform "${action}" on "${resource}"`,
    )
  }
}
