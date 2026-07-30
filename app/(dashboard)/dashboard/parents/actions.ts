"use server"

import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { createParent, createParentSchema, deleteParent as deleteParentDal, updateParent } from "@/lib/dal/parents"
import { createStudent } from "@/lib/dal/students"
import { prisma } from "@/lib/prisma"
import { sendMail } from "@/lib/mail"
import crypto from "crypto"
import { withTenantAuth } from "@/lib/tenant-auth"

export async function addParentAction(prevState: any, formData: FormData) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      const raw: any = Object.fromEntries(formData.entries())
      const studentIds = formData.getAll("studentIds") as string[]
      if (studentIds && studentIds.length > 0) {
        raw.studentIds = studentIds
      }
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

export async function updateParentAction(prevState: any, formData: FormData) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      const raw: any = Object.fromEntries(formData.entries())
      const id = raw.id as string
      if (!id) return { error: "Parent ID is missing" }

      const studentIds = formData.getAll("studentIds") as string[]
      if (studentIds && studentIds.length > 0) {
        raw.studentIds = studentIds
      }
      
      const result = createParentSchema.partial().safeParse(raw)

      if (!result.success) {
        return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
      }

      try {
        await updateParent(id, result.data)
        revalidatePath("/dashboard/parents")
        revalidatePath(`/dashboard/parents/${id}`)
        return { success: true }
      } catch (e: any) {
        console.error("Error updating parent:", e)
        return { error: `Failed to update parent: ${e?.message || e}` }
      }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}

export async function createStudentInlineForParentAction(name: string, classStr: string, admissionNumber?: string) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async (config, schoolId) => {
      const student = await createStudent({
        name,
        class: classStr,
        dateOfBirth: "2015-01-01",
        admissionNumber,
        parentName: "Pending Assignment",
        parentEmail: `pending_${Date.now()}@school.com`,
        parentMobile: "0000000000",
        totalFees: 0,
        sessionId: undefined,
      })
      revalidatePath("/dashboard/parents")
      return { success: true, studentItem: student }
    })
  } catch (e: any) {
    return { error: e.message || "Failed to create student inline" }
  }
}

export async function generateParentInvitation(parentId: string) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async (config, schoolId) => {
      const parent = await prisma.parent.findUnique({
        where: { id: parentId },
        include: { school: true },
      })
      if (!parent) throw new Error("Parent record not found.")
      if (parent.userId) throw new Error("Parent account has already been claimed.")

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
    })
  } catch (e: any) {
    console.error("Failed to generate parent invitation:", e)
    return { error: e.message || "Failed to generate parent invitation." }
  }
}

export async function deleteParentAction(id: string) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      try {
        await deleteParentDal(id)
        revalidatePath("/dashboard/parents")
        return { success: true }
      } catch (e: any) {
        return { error: "Failed to delete parent" }
      }
    })
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }
}