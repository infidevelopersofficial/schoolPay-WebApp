"use server"

import { prisma } from "@/lib/prisma"
import { validatePassword } from "@/lib/auth/password-policy"
import bcrypt from "bcryptjs"

export async function claimParentAccount(
  prevState: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const token = formData.get("token") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (!token) return "Invalid claim request."
  if (!password) return "Password is required."
  if (password !== confirmPassword) return "Passwords do not match."

  // 1. Enforce Password Policy
  const policy = validatePassword(password)
  if (!policy.isValid) {
    return policy.message
  }

  try {
    // 2. Validate IdentityToken
    const identityToken = await prisma.identityToken.findUnique({
      where: { token },
    })

    if (
      !identityToken ||
      identityToken.type !== "PARENT_INVITATION" ||
      identityToken.isClaimed ||
      identityToken.expires < new Date()
    ) {
      return "The invitation link is invalid or has expired."
    }

    const email = identityToken.email
    const metadata = identityToken.metadata as { parentId?: string } | null
    const parentId = metadata?.parentId

    if (!parentId) {
      return "Unable to resolve parent record details."
    }

    // 3. Find Parent
    const parent = await prisma.parent.findUnique({
      where: { id: parentId },
    })

    if (!parent) return "Parent record not found."
    if (parent.userId) return "This parent account has already been claimed."

    // 4. Check if User already exists with this email
    let user = await prisma.user.findUnique({ where: { email } })
    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.$transaction(async (tx) => {
      // 5. Create User if they don't exist
      if (!user) {
        user = await tx.user.create({
          data: {
            name: parent.name,
            email,
            phone: parent.mobile,
            hashedPassword,
            role: "PARENT",
            emailVerified: new Date(), // verified as they clicked the link sent to their email
          },
        })
      } else {
        // Update user to hold PARENT role and password
        user = await tx.user.update({
          where: { id: user.id },
          data: {
            hashedPassword,
            role: "PARENT",
            emailVerified: new Date(),
          },
        })
      }

      // 6. Connect Parent to User
      await tx.parent.update({
        where: { id: parentId },
        data: { userId: user.id },
      })

      // 7. Create UserSchool mapping
      const existingMembership = await tx.userSchool.findUnique({
        where: {
          userId_schoolId: {
            userId: user.id,
            schoolId: parent.schoolId,
          },
        },
      })

      if (!existingMembership) {
        await tx.userSchool.create({
          data: {
            userId: user.id,
            schoolId: parent.schoolId,
            role: "PARENT",
          },
        })
      }

      // 8. Claim invitation token
      await tx.identityToken.update({
        where: { token },
        data: {
          isClaimed: true,
          claimedAt: new Date(),
        },
      })

      // 9. Write AuthAuditLog
      await tx.authAuditLog.create({
        data: {
          userId: user.id,
          email,
          action: "INVITATION_CLAIMED",
          schoolId: parent.schoolId,
        },
      })
    })

    return "success"
  } catch (error) {
    console.error("Claim parent account error:", error)
    return "Failed to claim account. Please try again."
  }
}
