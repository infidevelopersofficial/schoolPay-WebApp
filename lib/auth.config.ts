/**
 * AUTH CONFIG — Edge-Safe
 *
 * This file is imported by middleware.ts which runs in the Edge Runtime.
 * It must NOT import anything that requires Node.js APIs (Prisma, bcrypt, etc).
 * Only page routing, session checks, and callback logic belong here.
 *
 * Phase 2 additions:
 * - PARENT role → redirected to /parent/dashboard (not the admin dashboard)
 * - /parent/* routes protected: only PARENT role or SUPER_ADMIN may access
 * - Unauthenticated access to /parent/* redirects to /login with ?returnTo param
 */

import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const pathname = nextUrl.pathname

      const isOnLoginPage   = pathname.startsWith("/login") || pathname.startsWith("/school/login")
      const isOnSchoolSelect = pathname.startsWith("/select-school")
      const isOnParentPortal = pathname.startsWith("/parent")
      const isApiRoute      = pathname.startsWith("/api")

      // API routes handle their own auth
      if (isApiRoute) return true

      // Unauthenticated → login
      if (!isLoggedIn && !isOnLoginPage) return false

      // Authenticated → away from login
      if (isLoggedIn && isOnLoginPage) {
        const user = auth?.user as {
          activeSchoolId?: string
          schoolRole?: string
          role?: string
        } | undefined

        // PARENT role → parent portal, not admin dashboard
        if (user?.schoolRole === "PARENT") {
          return Response.redirect(new URL("/parent/dashboard", nextUrl))
        }

        // STUDENT role → student portal, not admin dashboard
        if (user?.schoolRole === "STUDENT") {
          return Response.redirect(new URL("/student/dashboard", nextUrl))
        }

        return Response.redirect(new URL("/", nextUrl))
      }

      if (isLoggedIn) {
        const user = auth?.user as {
          activeSchoolId?: string
          schoolRole?: string
          role?: string
          parentId?: string
          studentId?: string
          isPendingActivation?: boolean
        } | undefined

        const hasSchool  = !!user?.activeSchoolId
        const isSuperAdmin = user?.role === "SUPER_ADMIN"
        const isParent   = user?.schoolRole === "PARENT"
        const isStudent  = user?.schoolRole === "STUDENT"
        const isPendingActivation = user?.isPendingActivation === true
        const isOnActivationRoute = pathname === "/student/activate"
        
        // ── Phase 5B.1: Activation Redirects ────────────────────────────────
        if (isStudent) {
          if (isPendingActivation && !isOnActivationRoute) {
            return Response.redirect(new URL("/student/activate", nextUrl))
          }
          if (!isPendingActivation && isOnActivationRoute) {
            return Response.redirect(new URL("/student/dashboard", nextUrl))
          }
        }
        
        // ── Parent portal routes ────────────────────────────────────────────
        if (isOnParentPortal) {
          // Only parents (or super admins previewing) may access /parent/*
          if (!isParent && !isSuperAdmin) {
            return Response.redirect(new URL("/", nextUrl))
          }
          // Parents without parentId linked → deny with message
          if (isParent && !user?.parentId) {
            return Response.redirect(new URL("/login?error=parent-not-linked", nextUrl))
          }
          return true
        }

        const isOnStudentPortal = pathname.startsWith("/student")

        // ── Student portal routes ───────────────────────────────────────────
        if (isOnStudentPortal) {
          if (!isStudent && !isSuperAdmin) {
            return Response.redirect(new URL("/", nextUrl))
          }
          if (isStudent && !user?.studentId) {
            return Response.redirect(new URL("/login?error=student-not-linked", nextUrl))
          }
          return true
        }

        // ── Admin dashboard routes ──────────────────────────────────────────
        // Parents and Students should not be on the admin portal at all
        if ((isParent || isStudent) && !isOnSchoolSelect) {
          const redirectPath = isParent ? "/parent/dashboard" : "/student/dashboard"
          return Response.redirect(new URL(redirectPath, nextUrl))
        }

        // Must have a school selected (unless SUPER_ADMIN)
        if (!hasSchool && !isSuperAdmin && !isOnSchoolSelect) {
          return Response.redirect(new URL("/select-school", nextUrl))
        }
      }

      return true
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.schoolRole = token.schoolRole as string | undefined
        session.user.activeSchoolId = token.activeSchoolId as string | undefined
        session.user.tenantType = token.tenantType as string | undefined
        session.user.planTier = token.planTier as string | undefined
        session.user.parentId = token.parentId as string | undefined
        session.user.studentId = token.studentId as string | undefined
        ;(session.user as any).isPendingActivation = token.isPendingActivation === true
      }
      return session
    },
  },
  providers: [], // Providers are configured in lib/auth.ts
} satisfies NextAuthConfig
