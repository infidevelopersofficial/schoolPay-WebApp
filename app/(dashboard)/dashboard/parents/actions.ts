"use server"

import { withTenantAuth } from "@/lib/tenant-auth"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { createParent, createParentSchema } from "@/lib/dal/parents"
import { prisma } from "@/lib/prisma"
import { sendMail } from "@/lib/mail"
import crypto from "crypto"

export async function addParentAction(prevState: any, formData: FormData) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {

  const raw = Object.fromEntries(formData.entries())
  const result = createParentSchema.safeParse(raw)

  if (!result.success) {
    return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
  }

  try {
    await createParent(result.data)
    revalidatePath("/dashboard/parents")
    return { success: true }
  } catch (e: any) {
    if (e?.code === "P2002") return { error: "A parent with this email already exists" }
    return { error: "Failed to create parent" }
  }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}

export async function generateParentInvitation(parentId: string) {
  return await withTenantAuth(null, ["ADMIN"], async () => {
    try {
      const parent = await prisma.parent.findUnique({
        where: { id: parentId },
        include: { school: true },
      })
      if (!parent) return { error: "Parent record not found." }
      if (parent.userId) return { error: "Parent account has already been claimed." }

      // Generate secure 64-char token
      const token = crypto.randomBytes(32).toString("hex")
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

      // Save in IdentityToken
      await prisma.identityToken.create({
        data: {
          email: parent.email,
          token,
          type: "PARENT_INVITATION",
          expires,
          metadata: { parentId },
          schoolId: parent.schoolId,
        },
      })

      // Log in AuthAuditLog
      await prisma.authAuditLog.create({
        data: {
          email: parent.email,
          action: "INVITATION_SENT",
          schoolId: parent.schoolId,
          metadata: { parentId, expires },
        },
      })

      // Send invitation email
      await sendMail({
        to: parent.email,
        subject: `Invitation to claim your Parent Portal account - ${parent.school.name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #6366f1; margin-bottom: 16px;">Welcome to the Parent Portal</h2>
            <p style="color: #334155; line-height: 1.6;">Hello ${parent.name},</p>
            <p style="color: #334155; line-height: 1.6;"><strong>${parent.school.name}</strong> has invited you to set up your Parent Portal account on SchoolPay. Using the portal, you can monitor your student's attendance, review grading results, and pay fees online.</p>
            <p style="color: #334155; line-height: 1.6;">Click the button below to set up your password and claim your account. This link is valid for 7 days.</p>
            <div style="margin: 24px 0;">
              <a href="/parent/claim?token=${token}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Setup Account</a>
            </div>
            <p style="font-size: 12px; color: #64748b;">If you were not expecting this invitation, you can safely ignore this email.</p>
          </div>
        `,
      })

      revalidatePath("/dashboard/parents")
      return { success: true }
    } catch (e: any) {
      console.error("Failed to generate parent invitation:", e)
      return { error: "Failed to generate parent invitation." }
    }
  })
}