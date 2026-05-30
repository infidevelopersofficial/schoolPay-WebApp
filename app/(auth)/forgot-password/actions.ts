"use server"

import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limiter"
import { sendMail } from "@/lib/mail"
import crypto from "crypto"
import { redis } from "@/lib/redis"

export async function requestPasswordReset(
  prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const email = (formData.get("email") as string)?.trim()?.toLowerCase()
  if (!email) return "Email is required."

  // Rate Limiting: 3 requests per 15 minutes
  const limit = await checkRateLimit(`forgot_password_${email}`, 3)
  if (!limit.success) {
    return "Too many requests. Please try again in 15 minutes."
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } })

    if (user) {
      // 1. Generate secure token
      const token = crypto.randomBytes(32).toString("hex")
      const expires = new Date(Date.now() + 15 * 60 * 1000) // 15 mins

      // 2. Save in Upstash Redis
      if (redis) {
        await redis.set(`reset:${token}`, user.id, { ex: 900 })
      }

      // 3. Log password reset request in AuthAuditLog
      await prisma.authAuditLog.create({
        data: {
          userId: user.id,
          email,
          action: "PASSWORD_RESET_REQUEST",
          metadata: { expires },
        },
      })

      // 4. Send recovery email
      await sendMail({
        to: email,
        subject: "Reset Your Password - SchoolPay",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #6366f1; margin-bottom: 16px;">Reset Your Password</h2>
            <p style="color: #334155; line-height: 1.6;">Hello ${user.name || "there"},</p>
            <p style="color: #334155; line-height: 1.6;">We received a request to reset your password. Click the link below to set up a new password. This link is valid for 15 minutes.</p>
            <div style="margin: 24px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            <p style="font-size: 12px; color: #64748b;">If you did not request a password reset, you can safely ignore this email.</p>
          </div>
        `,
      })
    }

    // Always return same message whether email exists or not
    return "If this email exists, a reset link has been sent."
  } catch (error) {
    console.error("Forgot password action error:", error)
    return "An error occurred. Please try again later."
  }
}
