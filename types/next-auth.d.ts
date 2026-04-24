import { DefaultSession, DefaultUser } from "next-auth"
import { DefaultJWT } from "next-auth/jwt"

/**
 * Augment the default Auth.js types to include `role` and
 * multi-tenant `activeSchoolId` on session, JWT, and User objects.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      activeSchoolId?: string
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role: string
    activeSchoolId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role?: string
    activeSchoolId?: string
    schoolRole?: string
  }
}
