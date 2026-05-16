"use server"

import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  avatar: z.string().optional(),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export async function updateProfileAction(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const raw = Object.fromEntries(formData.entries())
  const result = updateProfileSchema.safeParse(raw)

  if (!result.success) {
    return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: result.data.name,
        avatar: result.data.avatar || undefined,
      },
    })
    revalidatePath("/profile")
    revalidatePath("/")
    return { success: true }
  } catch (e) {
    return { error: "Failed to update profile" }
  }
}

export async function changePasswordAction(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const raw = Object.fromEntries(formData.entries())
  const result = changePasswordSchema.safeParse(raw)

  if (!result.success) {
    return { error: "Validation failed", fieldErrors: result.error.flatten().fieldErrors }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { hashedPassword: true },
    })

    if (!user?.hashedPassword) {
      return { error: "Cannot change password for OAuth accounts" }
    }

    const isValid = await bcrypt.compare(result.data.currentPassword, user.hashedPassword)
    if (!isValid) {
      return { error: "Current password is incorrect" }
    }

    const hashedPassword = await bcrypt.hash(result.data.newPassword, 12)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { hashedPassword },
    })

    return { success: true, message: "Password changed successfully" }
  } catch (e) {
    return { error: "Failed to change password" }
  }
}
