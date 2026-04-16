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
  entityId: string
  oldValues?: unknown
  newValues?: unknown
  description?: string
}

/**
 * Global Audit Logger
 * Safely executes inside Server Actions and extracts User bindings from Auth.js natively.
 * Can be attached to Prisma Transaction engines if strict multi-table atomic logic is required.
 */
export async function recordAuditLog(
  params: AuditLogParams,
  tx?: Prisma.TransactionClient,
) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    const userEmail = session?.user?.email

    const data = {
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      oldValues: params.oldValues ? (params.oldValues as Prisma.InputJsonValue) : Prisma.JsonNull,
      newValues: params.newValues ? (params.newValues as Prisma.InputJsonValue) : Prisma.JsonNull,
      description: params.description,
      userId: userId || null,
      userEmail: userEmail || null,
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
      description: params.description,
    })

    systemLogger.info(
      {
        auditAction: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        userId: userId ?? null,
        userEmail: userEmail ?? null,
        description: params.description,
      },
      "Audit log recorded",
    )
  } catch (error) {
    // In strict transactional paths with `tx`, re-throwing fails the entire transaction.
    // In background paths, failing audit generation logs to the backend gracefully but doesn't crash the UI.
    systemLogger.error({ err: error, ...params }, "Failed to generate Audit Log")
    if (tx) throw error
  }
}
