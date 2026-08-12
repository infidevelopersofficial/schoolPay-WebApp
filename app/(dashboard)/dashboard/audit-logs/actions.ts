"use server"

import { getAuditLogs, GetAuditLogsOptions } from "@/lib/dal/audit-logs"
import { withTenantAuth } from "@/lib/tenant-auth"

export const getAuditLogsAction = async (searchParams: GetAuditLogsOptions) => {
  return withTenantAuth(null, ["ADMIN"], async () => {
    return getAuditLogs(searchParams)
  })
}
