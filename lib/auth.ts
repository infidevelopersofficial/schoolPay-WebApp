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
import { accountBruteForceLimit } from "./ratelimit"
import { authLogger } from "@/lib/logger"
import { redis } from "@/lib/redis"

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        identifier: { label: "Email, Phone, or Admission Number", type: "text" },
        password: { label: "Password", type: "password" },
        schoolCode: { label: "School Code (Optional)", type: "text" },
        isOtp: { label: "OTP", type: "text" },
        role: { label: "Role", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null

        try {
          const identifier = (credentials.identifier as string)?.trim();
          const schoolCode = (credentials.schoolCode as string)?.trim();
          const isOtp = credentials.isOtp === "true" || credentials.isOtp === true;
          const role = credentials.role as string | undefined;

          // SCHOOLPAY_TEAM bypass
          if (!schoolCode && role === "SCHOOLPAY_TEAM") {
            const teamUser = await prisma.spayTeamUser.findUnique({
              where: { email: identifier }
            });
            if (!teamUser) return null;
            const isValid = await bcrypt.compare(credentials.password as string, teamUser.password);
            if (!isValid) return null;
            return {
              id: teamUser.id,
              name: teamUser.name,
              email: teamUser.email,
              role: "SCHOOLPAY_TEAM"
            };
          }

          // OTP bypass
          if (isOtp) {
             const otpKey = `otp:${schoolCode}:${identifier}`;
             if (redis) {
               const storedOtp = await redis.get(otpKey);
               if (!storedOtp || storedOtp !== credentials.password) return null;
               await redis.del(otpKey);
             }
             
             const parent = await prisma.parent.findFirst({
               where: { email: identifier, school: { OR: [{schoolCode: schoolCode}, {tenantId: schoolCode}, {slug: schoolCode}] } },
               include: { user: true }
             });
             if (parent && parent.user) {
               return {
                 id: parent.user.id,
                 name: parent.user.name,
                 email: parent.user.email,
                 role: parent.user.role
               }
             }
             return null;
          }
          
          let user = null;
          let isPendingActivation = false;

          if (schoolCode) {
            // Rate Limit Check
            const ratelimitKey = `auth:${schoolCode}:${identifier}`;
            const rlResult = await accountBruteForceLimit.limit(ratelimitKey);
            if (!rlResult.success) {
              authLogger.warn({ schoolCode, identifier }, "Distributed brute force block triggered.");
              throw new Error("Too many login attempts. Please try again later.");
            }

            // Route login flow based on role
            if (role === "STUDENT") {
              // Student Portal Login Flow via Admission Number or Email
              const student = await prisma.student.findFirst({
                where: {
                  OR: [
                    { admissionNumber: identifier },
                    { email: identifier },
                    { studentId: identifier }
                  ],
                school: {
                  OR: [
                    { slug: schoolCode },
                    { tenantId: schoolCode },
                    { schoolCode: schoolCode }
                  ]
                }
              },
              include: { user: true }
            });

            if (!student) {
              // Generic error to prevent enumeration
              throw new Error("Invalid credentials or account is suspended.");
            }

            if (!student.portalAccessEnabled) {
              authLogger.warn({ studentId: student.id }, "Student attempted login but portal access is disabled.");
              throw new Error("Invalid credentials or account is suspended.");
            }

            if (student.accountStatus === "SUSPENDED" || student.accountStatus === "ARCHIVED") {
              authLogger.warn({ studentId: student.id, status: student.accountStatus }, "Login attempt by suspended/archived student.");
              throw new Error("Invalid credentials or account is suspended.");
            }

            // Database brute force check (still enforced in addition to Redis)
            if (student.lockedUntil && student.lockedUntil > new Date()) {
              authLogger.warn({ studentId: student.id }, "Login attempt for locked student account.");
              throw new Error("Invalid credentials or account is suspended.");
            }

            if (student.accountStatus === "PENDING_ACTIVATION") {
              // Verify temporary password
              if (!student.tempPasswordHash || !student.tempPasswordExpiresAt) return null;

              if (student.tempPasswordExpiresAt < new Date()) {
                authLogger.warn({ studentId: student.id }, "Expired temp password attempt.");
                throw new Error("Invalid credentials or account is suspended.");
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
                throw new Error("Invalid credentials or account is suspended.");
              }

              // Reset failed attempts on success
              await prisma.student.update({
                where: { id: student.id },
                data: { failedLoginAttempts: 0, lockedUntil: null }
              });

              // Synthesize a minimal user object for pending session
              isPendingActivation = true;
              return {
                id: `pending_${student.id}`,
                name: student.name,
                email: student.email || `${student.admissionNumber}@student.internal`,
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
          } else {
            // ADMIN, TEACHER, PARENT multi-tenant login
            user = await prisma.user.findFirst({
              where: {
                OR: [
                  { email: { equals: identifier, mode: "insensitive" } },
                  { phone: identifier },
                  { schools: { some: { staffId: { equals: identifier, mode: "insensitive" } } } }
                ],
                schools: {
                  some: {
                    school: {
                      OR: [
                        { slug: { equals: schoolCode, mode: "insensitive" } },
                        { tenantId: { equals: schoolCode, mode: "insensitive" } },
                        { schoolCode: { equals: schoolCode, mode: "insensitive" } }
                      ]
                    }
                  }
                }
              }
            });

            if (!user) {
              throw new Error("Invalid credentials or account is suspended.");
            }

            if (user.lockedUntil && user.lockedUntil > new Date()) {
              authLogger.warn({ email: user.email }, "Locked user attempted login.")
              throw new Error("Your account has been locked. Please try again in 15 minutes.")
            }
          }
        }

          // Global Login Flow via Email or Phone
          if (!user && !schoolCode) {
            user = await prisma.user.findFirst({
              where: {
                OR: [
                  { email: { equals: identifier, mode: "insensitive" } },
                  { phone: identifier }
                ]
              }
            });

            if (user) {
              // Brute force check
              if (user.lockedUntil && user.lockedUntil > new Date()) {
                authLogger.warn({ email: user.email }, "Locked user attempted login.")
                await prisma.authAuditLog.create({
                  data: {
                    userId: user.id,
                    email: user.email,
                    action: "LOCKOUT",
                  }
                })
                throw new Error("Your account has been locked. Please try again in 15 minutes.")
              }
            }
          }

          if (!user?.hashedPassword) return null

          const isValidPassword = await bcrypt.compare(
            credentials.password as string,
            user.hashedPassword,
          )

          if (!isValidPassword) {
            if (!schoolCode && user) {
              const newAttempts = (user.failedLoginAttempts || 0) + 1
              const lockedUntil = newAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null
              
              await prisma.$transaction([
                prisma.user.update({
                  where: { id: user.id },
                  data: { failedLoginAttempts: newAttempts, lockedUntil }
                }),
                prisma.authAuditLog.create({
                  data: {
                    userId: user.id,
                    email: user.email,
                    action: "LOGIN_FAILURE",
                  }
                })
              ])

              if (lockedUntil) {
                throw new Error("Your account has been locked. Please try again in 15 minutes.")
              }
            }
            return null
          }

          // Successful authentication -> reset attempts
          if (!schoolCode && user) {
            await prisma.$transaction([
              prisma.user.update({
                where: { id: user.id },
                data: { failedLoginAttempts: 0, lockedUntil: null }
              }),
              prisma.authAuditLog.create({
                data: {
                  userId: user.id,
                  email: user.email,
                  action: "LOGIN_SUCCESS",
                }
              })
            ])
          }

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
        token.isImpersonating = false;

        
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
                school: { select: { type: true, plan: true, isDemo: true, demoExpiresAt: true } },
              },
            })

            if (memberships.length === 1) {
              token.activeSchoolId = memberships[0].schoolId
              token.schoolRole = memberships[0].role
              token.tenantType = memberships[0].school.type
              token.planTier = memberships[0].school.plan?.name || "FREE"
              token.isDemo = memberships[0].school.isDemo
              token.demoExpiresAt = memberships[0].school.demoExpiresAt?.toISOString()

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
      if (trigger === "update") {
        if (session?.exitImpersonation) {
           token.role = "SCHOOLPAY_TEAM";
           token.schoolRole = undefined;
           token.activeSchoolId = undefined;
           token.tenantType = undefined;
           token.planTier = undefined;
           token.isImpersonating = false;
           return token;
        }

        if (session?.impersonateSchoolId) {
          if (token.role !== "SCHOOLPAY_TEAM") {
             throw new Error("Forbidden");
          }
          token.activeSchoolId = session.impersonateSchoolId;
          token.role = "SCHOOL_ADMIN";
          token.isImpersonating = true;
          return token;
        }

        if (session?.activeSchoolId) {
        try {
          const membership = await prisma.userSchool.findUnique({
            where: {
              userId_schoolId: {
                userId: token.sub!,
                schoolId: session.activeSchoolId,
              },
            },
            include: { school: { include: { plan: true } } },
          })

          if (membership) {
            token.activeSchoolId = membership.schoolId
            token.schoolRole = membership.role
            token.tenantType = membership.school.type
            token.planTier = membership.school.plan?.name || "FREE"
            token.isDemo = membership.school.isDemo
            token.demoExpiresAt = membership.school.demoExpiresAt?.toISOString()
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

      }
      return token
    },
    async session({ session, token }) {
      if ((token as any).isSuspended) {
        // If suspended, invalidate session by wiping essential fields
        session.user.id = "";
        return session;
      }
      
      const configuredSession = await authConfig.callbacks!.session!({ session, token } as any);
      
      // Ensure required fields are set
      configuredSession.user.isImpersonating = token.isImpersonating === true;
      
      return configuredSession;
    }
  },
})