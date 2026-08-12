import { prisma } from "@/lib/prisma"
import { getSchoolId } from "@/lib/tenant-context"
import { withTenantRead } from "@/lib/dal/core"
import { withDAL } from "@/lib/dal/utils"
import { logger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"
import { Prisma } from "@prisma/client"

const log = logger.child({ domain: "audit-logs" })

export interface GetAuditLogsOptions {
  page?: number
  limit?: number
  entityType?: string
  action?: string
  dateFrom?: string
  dateTo?: string
  userEmail?: string
}

export async function getAuditLogs(opts: GetAuditLogsOptions = {}) {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId()
    const { 
      page = 1, 
      limit = 25, 
      entityType, 
      action, 
      dateFrom, 
      dateTo, 
      userEmail 
    } = opts

    const where: Prisma.AuditLogWhereInput = {
      schoolId
    }

    if (entityType) {
      where.entityType = entityType
    }

    if (action) {
      where.action = action
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        // Add 1 day to make it end-of-day inclusive
        const toDate = new Date(dateTo)
        toDate.setDate(toDate.getDate() + 1)
        where.createdAt.lt = toDate
      }
    }

    if (userEmail) {
      where.userEmail = {
        contains: userEmail,
        mode: "insensitive"
      }
    }

    const skip = (page - 1) * limit

    return withDAL(
      "auditLogs.list",
      async () => {
        const [logs, total] = await Promise.all([
          prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            include: {
              user: {
                select: { name: true }
              }
            }
          }),
          prisma.auditLog.count({ where })
        ])

        return {
          logs,
          total,
          totalPages: Math.ceil(total / limit),
          page
        }
      },
      { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY }
    )
  })
}
