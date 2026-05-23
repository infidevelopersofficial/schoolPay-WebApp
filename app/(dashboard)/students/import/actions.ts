"use server"

import { withTenantAuth } from "@/lib/tenant-auth"
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSchoolId } from "@/lib/tenant-context";

export async function importStudentsAction(data: any[]) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const schoolId = await getSchoolId();
  if (!schoolId) throw new Error("No school selected");

  // Filter out empty rows
  const validData = data.filter(row => row.firstName && row.lastName && row.email);

  if (validData.length === 0) {
    throw new Error("No valid data found to import");
  }

  // Get existing students to prevent duplicates
  const existingStudents = await prisma.student.findMany({
    where: { schoolId },
    select: { email: true }
  });
  
  const existingEmails = new Set(
    existingStudents.filter(s => s.email).map(s => s.email!.toLowerCase())
  );
  
  const newStudents = validData.filter(s => !s.email || !existingEmails.has(s.email.toLowerCase()));

  if (newStudents.length === 0) {
    throw new Error("All students in the file already exist (duplicate emails).");
  }

  const { enforcePlanLimit } = await import("@/lib/billing/limits");
  await enforcePlanLimit({ schoolId, limitType: "studentLimit", incrementBy: newStudents.length });

  // Transaction for safe bulk insert
  await prisma.$transaction(async (tx) => {
    // For large imports, createMany is much faster
    await tx.student.createMany({
      data: newStudents.map(row => ({
        schoolId,
        name: `${row.firstName} ${row.lastName}`.trim(),
        email: row.email,
        phone: row.phone || null,
        class: row.class || "Unassigned",
        section: row.section || "A",
        rollNumber: row.rollNumber || null,
        feeStatus: "PENDING",
        paidAmount: 0,
        pendingAmount: 0,
        admissionDate: new Date()
      })),
      skipDuplicates: true
    });

    // Authoritative sync
    await tx.usageRecord.updateMany({
      where: { schoolId },
      data: { currentStudents: { increment: newStudents.length } }
    });
  });

  return { success: true, imported: newStudents.length, duplicatesSkipped: validData.length - newStudents.length };
    })
  } catch (e: any) {
    throw new Error(e.message || "Unauthorized")
  }
}