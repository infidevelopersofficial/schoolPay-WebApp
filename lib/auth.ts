/**
 * AUTH — Full Configuration (Node.js Runtime Only)
 *
 * This file contains the complete NextAuth config including:
 * - PrismaAdapter for database persistence
 * - Credentials provider with bcrypt password verification
 * - JWT session strategy
 * - Custom callbacks for role-based access + multi-tenant school context
 *
 * DO NOT import this file in middleware.ts — use auth.config.ts instead.
 */

import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"
import { authLogger } from "@/lib/logger"

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // ── Defensive wrapper ──────────────────────────────────────────────
        // Prisma can throw when the database is unreachable or tables do not
        // exist yet (e.g. migrations not run, container stopped). An uncaught
        // rejection here propagates out of NextAuth and crashes the Next.js
        // worker thread. We catch every error, log it for observability, and
        // return null so NextAuth treats it as a failed login — keeping the
        // server alive and showing the user a generic "wrong credentials" error.
        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          })

          if (!user?.hashedPassword) return null

          const isValidPassword = await bcrypt.compare(
            credentials.password as string,
            user.hashedPassword,
          )

          if (!isValidPassword) return null

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.avatar,
          }
        } catch (err) {
          // Log at error level — this will auto-forward to Sentry via the
          // logger hook. The worker thread is NOT crashed.
          authLogger.error(
            { err, email: credentials.email },
            "Database error during authentication — DB may be unreachable or migrations not applied",
          )
          return null
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as { role?: string }).role

        // ── Multi-tenant: resolve the user's school memberships ────────
        // If the user belongs to exactly one school, set it automatically.
        // If they belong to multiple, leave null → triggers school selector.
        // SUPER_ADMINs skip this — they get the school selector always.
        try {
          if (token.role !== "SUPER_ADMIN") {
            const memberships = await prisma.userSchool.findMany({
              where: { userId: user.id },
              select: {
                schoolId: true,
                role: true,
                school: { select: { type: true, plan: true } },
              },
            })

            if (memberships.length === 1) {
              token.activeSchoolId = memberships[0].schoolId
              token.schoolRole = memberships[0].role
              token.tenantType = memberships[0].school.type
              token.planTier = memberships[0].school.plan

              // If the user is a PARENT role, resolve their parentId
              if (memberships[0].role === "PARENT") {
                const parent = await prisma.parent.findFirst({
                  where: { userId: user.id, schoolId: memberships[0].schoolId },
                  select: { id: true },
                })
                if (parent) token.parentId = parent.id
              }
            }
          }
        } catch (err) {
          authLogger.error(
            { err, userId: user.id },
            "Failed to resolve school memberships during login",
          )
        }
      }

      // ── Allow school switching & silent refresh via session.update() ─────────
      // Called from UI: update({ activeSchoolId: "..." }) or just update() to refresh data
      if (trigger === "update") {
        const targetSchoolId = session?.activeSchoolId || token.activeSchoolId
        
        if (targetSchoolId) {
          token.activeSchoolId = targetSchoolId as string

          // Also update the school-specific role, tenantType, planTier
          try {
            const membership = await prisma.userSchool.findUnique({
              where: {
                userId_schoolId: {
                  userId: token.sub!,
                  schoolId: token.activeSchoolId as string,
                },
              },
              select: {
                role: true,
                school: { select: { type: true, plan: true } },
              },
            })
            if (membership) {
              token.schoolRole = membership.role
              token.tenantType = membership.school.type
              token.planTier = membership.school.plan

              // Re-resolve parentId on refresh/switch
              if (membership.role === "PARENT") {
                const parent = await prisma.parent.findFirst({
                  where: { userId: token.sub!, schoolId: token.activeSchoolId as string },
                  select: { id: true },
                })
                token.parentId = parent?.id ?? undefined
              } else {
                token.parentId = undefined
              }
            }
          } catch (err) {
            authLogger.error(
              { err, userId: token.sub },
              "Failed to resolve school role during session update/refresh",
            )
          }
        }
      }

      return token
    },
  },
})
