"use client"

import { useSession } from "next-auth/react"
import { resolveTenantConfig, TenantConfig, TenantType } from "@/lib/tenant-config"

// Re-export types so we don't break existing imports
export type { TenantConfig, TenantType }

export function useTenantConfig(): TenantConfig {
  const { data: session } = useSession()
  const type = (session?.user?.tenantType as TenantType) || "SCHOOL"
  // Assuming session.user could carry dbSettings in the future, 
  // but for now we just resolve based on type.
  const dbSettings = (session?.user as any)?.tenantSettings || {}
  
  return resolveTenantConfig(type, dbSettings)
}
