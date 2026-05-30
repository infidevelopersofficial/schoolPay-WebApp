"use server"

import { prisma } from "@/lib/prisma"

export async function executeEmailVerification(token: string): Promise<{ success: boolean; message: string }> {
  if (!token) {
    return { success: false, message: "No verification token provided." }
  }

  try {
    // 1. Find and validate token
    const identityToken = await prisma.identityToken.findUnique({
      where: { token },
    })

    if (
      !identityToken ||
      identityToken.type !== "EMAIL_VERIFICATION" ||
      identityToken.isClaimed ||
      identityToken.expires < new Date()
    ) {
      return { success: false, message: "The email verification link is invalid or has expired." }
    }

    const email = identityToken.email

    // 2. Find user
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return { success: false, message: "User account not found." }
    }

    // 3. Mark email as verified and claim token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      }),
      prisma.identityToken.update({
        where: { token },
        data: {
          isClaimed: true,
          claimedAt: new Date(),
        },
      }),
      prisma.authAuditLog.create({
        data: {
          userId: user.id,
          email,
          action: "EMAIL_VERIFIED",
        },
      }),
    ])

    return { success: true, message: "Your email has been verified successfully!" }
  } catch (error) {
    console.error("Email verification action error:", error)
    return { success: false, message: "Failed to verify email. Please try again." }
  }
}
