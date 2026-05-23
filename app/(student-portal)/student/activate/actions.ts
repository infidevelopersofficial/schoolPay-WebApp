"use server"

import { prisma } from "@/lib/prisma"
import { auth, signOut } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { activationLockLimit } from "@/lib/ratelimit"

export async function activateStudentAccount(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user) throw new Error("Not authenticated")
    
    // session.user.studentId comes from our pending token
    const studentId = session.user.studentId
    const schoolId = session.user.activeSchoolId
    if (!studentId || !schoolId) throw new Error("Missing student or school context")

    const student = await prisma.student.findUnique({
      where: { id: studentId, schoolId },
      include: { user: true }
    })

    if (!student || student.accountStatus !== "PENDING_ACTIVATION") {
      throw new Error("Invalid activation request")
    }

    const dobString = formData.get("dob") as string
    const newPassword = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (newPassword !== confirmPassword) {
      return { error: "Passwords do not match" }
    }
    if (newPassword.length < 8) {
      return { error: "Password must be at least 8 characters" }
    }

    if (student.dateOfBirth) {
      // Compare dates. We only care about YYYY-MM-DD
      const storedDate = student.dateOfBirth.toISOString().split("T")[0]
      if (storedDate !== dobString) {
        // Record failure in Redis rate limit
        const rlResult = await activationLockLimit.limit(`activation:${studentId}`);
        
        await prisma.auditLog.create({
          data: {
            action: "STUDENT_ACTIVATION_FAILED",
            entityType: "Student",
            entityId: studentId,
            schoolId,
            userId: session.user.id
          }
        });

        if (!rlResult.success) {
          throw new Error("Too many failed activation attempts. Please try again in 15 minutes.");
        }

        return { error: "Incorrect Date of Birth" }
      }
    } else {
      // If no DOB in records, we might skip or fail. We'll skip for now if not recorded.
      if (dobString) {
        // Just a sanity check or we assume it's correct if not in DB? 
        // Actually, if we require DOB but it's null in DB, let's just let them through or force admin to set it.
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    let userId = student.userId

    if (!userId) {
      // Create user
      const user = await prisma.user.create({
        data: {
          name: student.name,
          email: student.email || `${student.admissionNumber}@student.${schoolId}.internal`,
          hashedPassword,
          role: "STUDENT",
        }
      })
      userId = user.id
      
      await prisma.userSchool.create({
        data: {
          userId: user.id,
          schoolId: schoolId,
          role: "STUDENT"
        }
      })
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: { hashedPassword }
      })
    }

    await prisma.student.update({
      where: { id: studentId },
      data: {
        userId,
        accountStatus: "ACTIVE",
        tempPasswordHash: null,
        tempPasswordExpiresAt: null,
        failedLoginAttempts: 0,
        lockedUntil: null
      }
    })

    await prisma.auditLog.create({
      data: {
        action: "STUDENT_ACTIVATED",
        entityType: "Student",
        entityId: studentId,
        schoolId,
        userId
      }
    })

  } catch (err: any) {
    return { error: err.message || "Failed to activate account" }
  }

  // Force re-login with new password
  await signOut({ redirectTo: "/school/login?activated=true" })
}
