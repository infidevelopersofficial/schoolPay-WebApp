"use server"

import { prisma } from "@/lib/prisma"
import { withTenantAuth } from "@/lib/tenant-auth"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import crypto from "crypto"
import { enforceFeatureAccess } from "@/lib/billing/limits"

function generateStrongPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*";
  let pass = "";
  for (let i = 0; i < 12; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

export async function generateStudentCredentials(studentId: string) {
  return withTenantAuth(null, ["ADMIN", "SUPER_ADMIN"], async (config, schoolId) => {
    const session = await import("@/lib/auth").then(m => m.auth());
    const userId = session?.user?.id;
    if (!userId) throw new Error("Unauthorized");

    // Enforce feature access
    await enforceFeatureAccess({ schoolId, feature: "studentPortal" });

    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId }
    });
    
    if (!student) throw new Error("Student not found");

    const rawPassword = generateStrongPassword();
    const tempPasswordHash = await bcrypt.hash(rawPassword, 10);
    const tempPasswordExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.student.update({
      where: { id: studentId },
      data: {
        tempPasswordHash,
        tempPasswordExpiresAt,
        portalAccessEnabled: true,
        accountStatus: "PENDING_ACTIVATION",
        failedLoginAttempts: 0,
        lockedUntil: null
      }
    });

    await prisma.auditLog.create({
      data: {
        action: "STUDENT_CREDENTIAL_GENERATED",
        entityType: "Student",
        entityId: studentId,
        schoolId,
        userId
      }
    });

    revalidatePath(`/students/${studentId}`);
    return { rawPassword };
  });
}

export async function suspendStudentAccess(studentId: string) {
  return withTenantAuth(null, ["ADMIN", "SUPER_ADMIN"], async (config, schoolId) => {
    const session = await import("@/lib/auth").then(m => m.auth());
    const userId = session?.user?.id;
    if (!userId) throw new Error("Unauthorized");

    await prisma.student.update({
      where: { id: studentId, schoolId },
      data: { accountStatus: "SUSPENDED" }
    });

    await prisma.auditLog.create({
      data: {
        action: "STUDENT_SUSPENDED",
        entityType: "Student",
        entityId: studentId,
        schoolId,
        userId
      }
    });

    revalidatePath(`/students/${studentId}`);
  });
}

export async function reactivateStudentAccess(studentId: string) {
  return withTenantAuth(null, ["ADMIN", "SUPER_ADMIN"], async (config, schoolId) => {
    const session = await import("@/lib/auth").then(m => m.auth());
    const userId = session?.user?.id;
    if (!userId) throw new Error("Unauthorized");

    const student = await prisma.student.findFirst({
      where: { id: studentId, schoolId },
      include: { user: true }
    });
    
    if (!student) throw new Error("Not found");
    const newStatus = student.user ? "ACTIVE" : "PENDING_ACTIVATION";

    await prisma.student.update({
      where: { id: studentId, schoolId },
      data: { accountStatus: newStatus }
    });

    await prisma.auditLog.create({
      data: {
        action: "STUDENT_REACTIVATED",
        entityType: "Student",
        entityId: studentId,
        schoolId,
        userId
      }
    });

    revalidatePath(`/students/${studentId}`);
  });
}

export async function bulkGenerateStudentCredentials(studentIds: string[]) {
  return withTenantAuth(null, ["ADMIN", "SUPER_ADMIN"], async (config, schoolId) => {
    const session = await import("@/lib/auth").then(m => m.auth());
    const userId = session?.user?.id;
    if (!userId) throw new Error("Unauthorized");

    // Enforce feature access
    await enforceFeatureAccess({ schoolId, feature: "studentPortal" });

    const students = await prisma.student.findMany({
      where: { id: { in: studentIds }, schoolId }
    });

    let csvContent = "Student Name,Admission Number,School Code,Temporary Password\n";

    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new Error("School not found");

    for (const student of students) {
      const rawPassword = generateStrongPassword();
      const tempPasswordHash = await bcrypt.hash(rawPassword, 10);
      const tempPasswordExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await prisma.student.update({
        where: { id: student.id },
        data: {
          tempPasswordHash,
          tempPasswordExpiresAt,
          portalAccessEnabled: true,
          accountStatus: "PENDING_ACTIVATION",
          failedLoginAttempts: 0,
          lockedUntil: null
        }
      });

      csvContent += `"${student.name}","${student.admissionNumber || ''}","${school.slug}","${rawPassword}"\n`;
    }

    await prisma.auditLog.create({
      data: {
        action: "STUDENT_CREDENTIAL_EXPORTED",
        entityType: "Student_Bulk",
        entityId: `${students.length} students`,
        schoolId,
        userId
      }
    });

    revalidatePath("/students");
    return csvContent;
  });
}
