"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { redis } from "@/lib/redis"

export async function executePasswordReset(
  prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const token = formData.get("token") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (!token) return "Invalid reset request."
  if (!password) return "Password is required."
  if (password !== confirmPassword) return "Passwords do not match."

  // 1. Password policy verification
  const isStrong = /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
  if (!isStrong) {
    return "Password must be at least 8 characters long, contain 1 uppercase letter and 1 number.";
  }

  try {
    // 2. Validate Token in Redis
    const userId = redis ? await redis.get<string>(`reset:${token}`) : null;

    if (!userId) {
      return "The password reset link is invalid or has expired.";
    }

    // 3. Find User
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return "User account not found.";

    const email = user.email || "";

    // 4. Update password and unlock account
    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          hashedPassword,
          failedLoginAttempts: 0,
          lockedUntil: null,
          passwordChangedAt: new Date(),
        },
      }),
      prisma.authAuditLog.create({
        data: {
          userId: user.id,
          email,
          action: "PASSWORD_RESET",
        },
      }),
    ])

    // Invalidate token
    if (redis) {
      await redis.del(`reset:${token}`);
    }

    return "success"
  } catch (error) {
    console.error("Reset password action error:", error)
    return "Failed to reset password. Please try again."
  }
}
