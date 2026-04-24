import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { systemLogger } from "@/lib/logger"
import { addBreadcrumb } from "@/lib/observability/sentry-helpers"

interface AuditLogParams {
  action: "CREATE" | "UPDATE" | "SOFT_DELETE" | "REFUND"
  /**
   * Every model that can be audited. Stored as a plain String in the DB so
   * adding new values here does NOT require a migration.
   */
  entityType:
    | "STUDENT"
    | "TEACHER"
    | "PARENT"
    | "CLASS"
    | "SUBJECT"
    | "PAYMENT"
    | "FEE"
    | "EXAM"
    | "RESULT"
    | "ATTENDANCE"
    | "LESSON"
    | "EVENT"
    | "MESSAGE"
    | "ANNOUNCEMENT"
    | "SCHOOL"
  entityId: string
  oldValues?: unknown
  newValues?: unknown
  description?: string
  /**
   * Explicit schoolId — callers should pass this directly from their DAL
   * context rather than relying on a second auth() call. This avoids double
   * JWT decoding and ensures the correct tenant is logged even inside
   * Prisma transactions where React.cache() does not deduplicate auth().
   */
  schoolId?: string
  /**
   * Explicit userId — pass from session when already resolved to avoid
   * a second auth() call inside Prisma transactions.
   */
  userId?: string
  userEmail?: string
}

/**
 * Global Audit Logger
 * Safely executes inside Server Actions and extracts User bindings from Auth.js.
 * Accepts optional explicit userId/schoolId to avoid redundant auth() calls
 * inside Prisma transactions (React.cache does not deduplicate across tx boundary).
 * Can be attached to Prisma Transaction engines if strict multi-table atomic logic is required.
 */
export async function recordAuditLog(
  params: AuditLogParams,
  tx?: Prisma.TransactionClient,
) {
  try {
    // Use explicitly passed values first; fall back to session only when missing.
    // This prevents a second auth() call inside $transaction blocks.
    let userId = params.userId
    let userEmail = params.userEmail
    let schoolId = params.schoolId

    if (!userId || !userEmail) {
      const session = await auth()
      userId = userId ?? session?.user?.id ?? undefined
      userEmail = userEmail ?? session?.user?.email ?? undefined
      schoolId = schoolId ?? ((session?.user as any)?.activeSchoolId as string | undefined)
    }

    const data = {
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      oldValues: params.oldValues ? (params.oldValues as Prisma.InputJsonValue) : Prisma.JsonNull,
      newValues: params.newValues ? (params.newValues as Prisma.InputJsonValue) : Prisma.JsonNull,
      description: params.description,
      userId: userId || null,
      userEmail: userEmail || null,
      schoolId: schoolId || null,
    }

    if (tx) {
      await tx.auditLog.create({ data })
    } else {
      await prisma.auditLog.create({ data })
    }

    // Add a Sentry breadcrumb so audit events appear in the error timeline.
    addBreadcrumb("user", `Audit: ${params.action} ${params.entityType}`, {
      entityId: params.entityId,
      userId: userId ?? null,
      schoolId: schoolId ?? null,
      description: params.description,
    })

    systemLogger.info(
      {
        auditAction: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        userId: userId ?? null,
        userEmail: userEmail ?? null,
        schoolId: schoolId ?? null,
        description: params.description,
      },
      "Audit log recorded",
    )
  } catch (error) {
    systemLogger.error({ err: error, ...params }, "Failed to generate Audit Log")
    if (tx) throw error
  }
}
