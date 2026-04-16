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
      const isApiRoute = nextUrl.pathname.startsWith("/api")

      // API routes handle their own authentication
      if (isApiRoute) return true

      // Redirect unauthenticated users to login page
      if (!isLoggedIn && !isOnLoginPage) return false

      // Redirect authenticated users away from login page
      if (isLoggedIn && isOnLoginPage) {
        return Response.redirect(new URL("/", nextUrl))
      }

      return true
    },
  },
  providers: [], // Providers are configured in lib/auth.ts
} satisfies NextAuthConfig
