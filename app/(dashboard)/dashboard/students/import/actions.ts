"use server"

import { withTenantAuth } from "@/lib/tenant-auth"
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSchoolId } from "@/lib/tenant-context";
import { hash } from "bcryptjs";

export async function importStudentsBatchAction(
  batch: any[],
  createParentAccounts: boolean
) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      const session = await auth();
      if (!session) throw new Error("Unauthorized");

      const schoolId = await getSchoolId();
      if (!schoolId) throw new Error("No school selected");

      // Validate basic structure
      if (!Array.isArray(batch) || batch.length === 0) {
        throw new Error("No valid data found to import");
      }

      // Check limits
      const { enforcePlanLimit } = await import("@/lib/billing/limits");
      await enforcePlanLimit({ schoolId, limitType: "studentLimit", incrementBy: batch.length });

      let importedStudentsCount = 0;
      let skippedStudentsCount = 0;

      await prisma.$transaction(async (tx) => {
        // --- 1. Process Parents ---
        const parentEmails = Array.from(new Set(batch.map(r => r.parent_email).filter(Boolean)));
        const existingParents = await tx.parent.findMany({
          where: { schoolId, email: { in: parentEmails } }
        });
        const existingParentEmails = new Set(existingParents.map(p => p.email.toLowerCase()));

        // Create missing parents
        const missingParents = batch
          .filter(r => r.parent_email && !existingParentEmails.has(r.parent_email.toLowerCase()))
          .map(r => ({
            name: r.parent_name || "Unknown Parent",
            email: r.parent_email,
            mobile: r.parent_phone || "",
            schoolId,
            address: r.address || null
          }))
          // Deduplicate missing parents by email
          .filter((v, i, a) => a.findIndex(t => t.email.toLowerCase() === v.email.toLowerCase()) === i);

        for (const p of missingParents) {
          let userId: string | null = null;
          
          if (createParentAccounts && p.email) {
            // Create user account
            const existingUser = await tx.user.findUnique({ where: { email: p.email } });
            if (!existingUser) {
              const defaultPassword = await hash(p.mobile || "password123", 10);
              const user = await tx.user.create({
                data: {
                  name: p.name,
                  email: p.email,
                  hashedPassword: defaultPassword,
                  role: "PARENT",
                  schools: {
                    create: {
                      schoolId,
                      role: "PARENT"
                    }
                  }
                }
              });
              userId = user.id;
            } else {
              userId = existingUser.id;
            }
          }

          await tx.parent.create({
            data: {
              ...p,
              userId
            }
          });
        }

        // Re-fetch all parents to map their IDs
        const allParents = await tx.parent.findMany({
          where: { schoolId, email: { in: parentEmails } }
        });
        const parentIdMap = new Map<string, string>();
        allParents.forEach(p => parentIdMap.set(p.email.toLowerCase(), p.id));

        // --- 2. Process Students ---
        // Exclude duplicate roll numbers or existing emails (if email provided)
        const newEmails = batch.map(r => r.email).filter(Boolean);
        const newRollNumbers = batch.map(r => r.roll_number).filter(Boolean);

        const existingStudents = await tx.student.findMany({
          where: {
            schoolId,
            OR: [
              { email: { in: newEmails } },
              { rollNumber: { in: newRollNumbers } }
            ]
          }
        });

        const existingEmailsSet = new Set(existingStudents.map(s => s.email?.toLowerCase()).filter(Boolean));
        const existingRollsSet = new Set(existingStudents.map(s => s.rollNumber).filter(Boolean));

        const validStudents = batch.filter(r => {
          if (r.email && existingEmailsSet.has(r.email.toLowerCase())) return false;
          if (r.roll_number && existingRollsSet.has(r.roll_number)) return false;
          return true;
        });

        skippedStudentsCount = batch.length - validStudents.length;

        if (validStudents.length > 0) {
          await tx.student.createMany({
            data: validStudents.map(row => {
              const dob = row.dob ? new Date(row.dob) : null;
              const pId = row.parent_email ? parentIdMap.get(row.parent_email.toLowerCase()) : null;
              
              return {
                schoolId,
                name: row.name.trim(),
                email: row.email || null,
                phone: row.phone || null,
                class: row.class || "Unassigned",
                section: row.section || "A",
                rollNumber: row.roll_number || null,
                dateOfBirth: dob && !isNaN(dob.getTime()) ? dob : null,
                address: row.address || null,
                parentId: pId || null,
                feeStatus: "PENDING",
                paidAmount: 0,
                pendingAmount: 0,
                admissionDate: new Date()
              };
            }),
            skipDuplicates: true
          });

          // Authoritative sync
          await tx.usageRecord.updateMany({
            where: { schoolId },
            data: { currentStudents: { increment: validStudents.length } }
          });
          
          importedStudentsCount = validStudents.length;
        }
      });

      return { 
        success: true, 
        imported: importedStudentsCount, 
        skipped: skippedStudentsCount 
      };
    })
  } catch (e: any) {
    return { error: e.message || "Failed to import students" }
  }
}