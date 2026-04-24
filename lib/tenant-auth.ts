import { getTenantContext } from "@/lib/tenant-context"
import { resolveTenantConfig, TenantConfig } from "@/lib/tenant-config"
import { tenantContext } from "@/lib/prisma"

export class UnauthorizedFeatureError extends Error {
  constructor(message = "Feature is not enabled for this tenant") {
    super(message)
    this.name = "UnauthorizedFeatureError"
  }
}

export class UnauthorizedRoleError extends Error {
  constructor(message = "User role is not authorized for this action") {
    super(message)
    this.name = "UnauthorizedRoleError"
  }
}

/**
 * Higher Order Wrapper for Server Actions & API Route handlers
 * Ensures that the tenant has the required feature enabled, the user has the required role,
 * and initializes the AsyncLocalStorage context so Prisma RLS is applied.
 */
export async function withTenantAuth<T>(
  requiredFeature: keyof TenantConfig | null,
  allowedRoles: string[] | null,
  action: (config: TenantConfig, schoolId: string) => Promise<T>
): Promise<T> {
  const { schoolId, tenantType, schoolRole } = await getTenantContext()
  const config = resolveTenantConfig(tenantType as any)

  if (requiredFeature && !config[requiredFeature]) {
    throw new UnauthorizedFeatureError(`Feature ${String(requiredFeature)} is disabled for ${tenantType}`)
  }

  // Ensure role is authorized
  if (allowedRoles && schoolRole && !allowedRoles.includes(schoolRole)) {
    // Note: SUPER_ADMIN global checks can be added here if they bypass schoolRole
    throw new UnauthorizedRoleError(`Role ${schoolRole} is not authorized`)
  }

  // Run the action inside the AsyncLocalStorage context for global data isolation
  return tenantContext.run({ schoolId }, () => {
    return action(config, schoolId)
  })
}

/**
 * System Context Wrapper for Webhooks or Admin Background Jobs
 * Runs the action without a specific school context, bypassing RLS.
 */
export async function withSystemContext<T>(
  action: () => Promise<T>
): Promise<T> {
  return tenantContext.run({ schoolId: "" }, () => {
    return action()
  })
}
