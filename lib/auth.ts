/**
 * AUTH — Full Configuration (Node.js Runtime Only)
 *
 * This file contains the complete NextAuth config including:
 * - PrismaAdapter for database persistence
 * - Credentials provider with bcrypt password verification
 * - JWT session strategy
 * - Custom callbacks for role-based access
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
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
      }
      return session
    },
  },
})
