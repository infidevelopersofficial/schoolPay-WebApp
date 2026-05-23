const fs = require('fs');

const authTsContent = `/**
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
        identifier: { label: "Email, Phone, or Admission Number", type: "text" },
        password: { label: "Password", type: "password" },
        schoolCode: { label: "School Code (Optional)", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null

        try {
          const identifier = credentials.identifier as string;
          const schoolCode = credentials.schoolCode as string | undefined;
          
          let user = null;
          let isPendingActivation = false;

          if (schoolCode) {
            // Student Portal Login Flow via Admission Number
            const student = await prisma.student.findFirst({
              where: {
                admissionNumber: identifier,
                school: { slug: schoolCode }
              },
              include: { user: true }
            });

            if (!student) return null;

            if (!student.portalAccessEnabled) {
              authLogger.warn({ studentId: student.id }, "Student attempted login but portal access is disabled.");
              return null;
            }

            if (student.accountStatus === "SUSPENDED" || student.accountStatus === "ARCHIVED") {
              authLogger.warn({ studentId: student.id, status: student.accountStatus }, "Login attempt by suspended/archived student.");
              return null;
            }

            // Brute force check
            if (student.lockedUntil && student.lockedUntil > new Date()) {
              authLogger.warn({ studentId: student.id }, "Login attempt for locked student account.");
              throw new Error("Account is temporarily locked. Try again later.");
            }

            if (student.accountStatus === "PENDING_ACTIVATION") {
              // Verify temporary password
              if (!student.tempPasswordHash || !student.tempPasswordExpiresAt) return null;

              if (student.tempPasswordExpiresAt < new Date()) {
                throw new Error("Temporary password has expired. Please contact administration.");
              }

              const isValidPassword = await bcrypt.compare(
                credentials.password as string,
                student.tempPasswordHash
              );

              if (!isValidPassword) {
                const newAttempts = (student.failedLoginAttempts || 0) + 1;
                const lockedUntil = newAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
                await prisma.student.update({
                  where: { id: student.id },
                  data: { failedLoginAttempts: newAttempts, lockedUntil }
                });
                return null;
              }

              // Reset failed attempts on success
              await prisma.student.update({
                where: { id: student.id },
                data: { failedLoginAttempts: 0, lockedUntil: null }
              });

              // Synthesize a minimal user object for pending session
              isPendingActivation = true;
              return {
                id: \`pending_\${student.id}\`,
                name: student.name,
                email: student.email || \`\${student.admissionNumber}@student.internal\`,
                role: "GUEST",
                schoolRole: "STUDENT",
                activeSchoolId: student.schoolId,
                studentId: student.id,
                isPendingActivation: true
              };
            }

            // If ACTIVE, they must have a user account linked
            if (student.user) {
              user = student.user;
            } else {
              return null;
            }
          }

          // Global Login Flow via Email or Phone
          if (!user && !schoolCode) {
            user = await prisma.user.findFirst({
              where: {
                OR: [
                  { email: identifier },
                  { phone: identifier }
                ]
              }
            });
          }

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
        } catch (err: any) {
          authLogger.error(
            { err, identifier: credentials.identifier },
            "Database error during authentication"
          )
          if (err.message && (err.message.includes("locked") || err.message.includes("expired"))) {
            throw err;
          }
          return null
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        
        const isPendingActivation = (user as any).isPendingActivation;
        if (isPendingActivation) {
          token.isPendingActivation = true;
          token.schoolRole = (user as any).schoolRole;
          token.activeSchoolId = (user as any).activeSchoolId;
          token.studentId = (user as any).studentId;
          return token;
        }

        // ── Multi-tenant: resolve the user's school memberships ────────
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

              if (memberships[0].role === "PARENT") {
                const parent = await prisma.parent.findFirst({
                  where: { userId: user.id, schoolId: memberships[0].schoolId },
                  select: { id: true },
                })
                if (parent) token.parentId = parent.id
              }

              if (memberships[0].role === "STUDENT") {
                const student = await prisma.student.findFirst({
                  where: { userId: user.id, schoolId: memberships[0].schoolId },
                  select: { id: true, accountStatus: true },
                })
                if (student) {
                  token.studentId = student.id;
                  if (student.accountStatus === "SUSPENDED" || student.accountStatus === "ARCHIVED") {
                    token.isSuspended = true; // Mark token as suspended
                  }
                }
              }
            }
          }
        } catch (err) {
          authLogger.error(
            { err, userId: user.id },
            "Failed to resolve school memberships during login"
          )
        }
      }

      // ── Real-time Suspension Check for existing sessions ────────
      if (token.studentId && !token.isPendingActivation) {
        try {
          const student = await prisma.student.findUnique({
            where: { id: token.studentId as string },
            select: { accountStatus: true }
          });
          if (student && (student.accountStatus === "SUSPENDED" || student.accountStatus === "ARCHIVED")) {
            token.isSuspended = true;
          } else {
            token.isSuspended = false;
          }
        } catch (error) {
          // Ignore lookup errors
        }
      }

      // ── Allow school switching & silent refresh via session.update() ─────────
      if (trigger === "update" && session?.activeSchoolId) {
        try {
          const membership = await prisma.userSchool.findUnique({
            where: {
              userId_schoolId: {
                userId: token.sub!,
                schoolId: session.activeSchoolId,
              },
            },
            include: { school: true },
          })

          if (membership) {
            token.activeSchoolId = membership.schoolId
            token.schoolRole = membership.role
            token.tenantType = membership.school.type
            token.planTier = membership.school.plan
            authLogger.info(
              { userId: token.sub, schoolId: membership.schoolId },
              "Session context switched to new school",
            )
          }
        } catch (err) {
          authLogger.error(
            { err, userId: token.sub, targetSchoolId: session.activeSchoolId },
            "Failed to switch school context",
          )
        }
      }

      return token
    },
    async session({ session, token }) {
      if ((token as any).isSuspended) {
        // If suspended, invalidate session by wiping essential fields
        session.user.id = "";
        return session;
      }
      return authConfig.callbacks!.session!({ session, token } as any);
    }
  },
})`;

fs.writeFileSync('lib/auth.ts', authTsContent);
console.log("Rewrote lib/auth.ts completely.");
