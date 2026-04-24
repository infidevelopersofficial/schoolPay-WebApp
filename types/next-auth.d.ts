import { DefaultSession, DefaultUser } from "next-auth"
import { DefaultJWT } from "next-auth/jwt"

/**
 * Phase 2: Augmented Auth.js types
 *
 * Session carries:
 * - role           Global platform role (SUPER_ADMIN | ADMIN)
 * - schoolRole     Per-tenant role (ADMIN | TEACHER | PARENT | STUDENT)
 * - activeSchoolId Currently selected school/tenant
 * - tenantType     Type of the active tenant (SCHOOL | COACHING_CENTER | PRIVATE_TUTOR)
 * - planTier       Subscription plan (FREE | STARTER | PROFESSIONAL | ENTERPRISE)
 * - parentId       Populated when schoolRole === "PARENT" — links to Parent record
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string              // Global platform role
      schoolRole?: string       // Per-tenant role within the active school
      activeSchoolId?: string
      tenantType?: string       // "SCHOOL" | "COACHING_CENTER" | "PRIVATE_TUTOR"
      planTier?: string         // "FREE" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE"
      parentId?: string         // Set when schoolRole === "PARENT"
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role: string
    schoolRole?: string
    activeSchoolId?: string
    tenantType?: string
    planTier?: string
    parentId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role?: string
    activeSchoolId?: string
    schoolRole?: string
    tenantType?: string
    planTier?: string
    parentId?: string
  }
}
