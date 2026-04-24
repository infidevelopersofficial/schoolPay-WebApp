/**
 * AUTH CONFIG — Edge-Safe
 *
 * This file is imported by middleware.ts which runs in the Edge Runtime.
 * It must NOT import anything that requires Node.js APIs (Prisma, bcrypt, etc).
 * Only page routing, session checks, and callback logic belong here.
 *
 * The full auth config (with providers, adapter, etc.) lives in auth.ts.
 */

import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnLoginPage = nextUrl.pathname.startsWith("/login")
      const isOnSchoolSelect = nextUrl.pathname.startsWith("/select-school")
      const isApiRoute = nextUrl.pathname.startsWith("/api")

      // API routes handle their own authentication
      if (isApiRoute) return true

      // Redirect unauthenticated users to login page
      if (!isLoggedIn && !isOnLoginPage) return false

      // Redirect authenticated users away from login page
      if (isLoggedIn && isOnLoginPage) {
        return Response.redirect(new URL("/", nextUrl))
      }

      // ── Multi-tenant: enforce school selection ─────────────────────────
      // Authenticated users without an active school must pick one before
      // accessing the dashboard. SUPER_ADMINs can also bypass if needed.
      if (isLoggedIn && !isOnSchoolSelect && !isOnLoginPage) {
        const user = auth?.user as { activeSchoolId?: string; role?: string } | undefined
        const hasSchool = !!user?.activeSchoolId
        const isSuperAdmin = user?.role === "SUPER_ADMIN"

        // SUPER_ADMINs can access without a school context (for admin views)
        if (!hasSchool && !isSuperAdmin) {
          return Response.redirect(new URL("/select-school", nextUrl))
        }
      }

      return true
    },
  },
  providers: [], // Providers are configured in lib/auth.ts
} satisfies NextAuthConfig
