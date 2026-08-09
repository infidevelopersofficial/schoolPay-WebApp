"use server"

import { withTenantAuth } from "@/lib/tenant-auth"
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSchoolId } from "@/lib/tenant-context";
import { hash } from "bcryptjs";
import { createTeacherSchema } from "@/lib/dal/teachers";

export async function importTeachersBatchAction(batch: any[]) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      const session = await auth();
      if (!session) throw new Error("Unauthorized");
      const schoolId = await getSchoolId();
      if (!schoolId) throw new Error("No school selected");

      if (!Array.isArray(batch) || batch.length === 0) {
        throw new Error("No valid data found to import");
      }


      let importedCount = 0;
      let skippedCount = 0;
      const rejectedRows: any[] = [];

      // 1. Pre-flight DB query for duplicates
      const incomingEmails = batch.map(r => r.email).filter(Boolean);
      const existingUsers = await prisma.user.findMany({
        where: { email: { in: incomingEmails } },
        select: { email: true }
      });
      const dbEmailsSet = new Set(existingUsers.map(u => u.email!.toLowerCase()));
      
      // Running set to catch duplicates within the same batch chunk
      const runningEmailsSet = new Set(dbEmailsSet);

      const validTeachers = [];

      for (const row of batch) {
        // Validation using safeParse
        const parsed = createTeacherSchema.safeParse(row);
        if (!parsed.success) {
          rejectedRows.push({ row, error: "Validation failed: " + parsed.error.issues.map(i => i.message).join(", ") });
          skippedCount++;
          continue;
        }
        
        // In-batch duplicate detection
        if (runningEmailsSet.has(parsed.data.email.toLowerCase())) {
          rejectedRows.push({ row, error: "Duplicate email found (either in DB or earlier in this batch)." });
          skippedCount++;
          continue;
        }

        runningEmailsSet.add(parsed.data.email.toLowerCase());
        validTeachers.push(parsed.data);
      }
      
      if (validTeachers.length > 0) {
        // Check limits before DB insertion
        const { enforcePlanLimit } = await import("@/lib/billing/limits");
        await enforcePlanLimit({ schoolId, limitType: "staffLimit", incrementBy: validTeachers.length });
      }
      
      // 2. Safely create each Teacher + User atomically, sequentially
      for (const row of validTeachers) {
        try {
          await prisma.$transaction(async (tx) => {
            const defaultPassword = await hash(row.phone, 10);
            
            const user = await tx.user.create({
              data: {
                name: row.name,
                email: row.email,
                phone: row.phone,
                hashedPassword: defaultPassword,
                role: "TEACHER",
                schools: {
                  create: { schoolId, role: "TEACHER" }
                }
              }
            });

            const teacher = await tx.teacher.create({
              data: {
                schoolId,
                name: row.name,
                email: row.email,
                phone: row.phone,
                gender: row.gender,
                joiningDate: row.joiningDate ? new Date(row.joiningDate) : new Date(),
              }
            });

            await tx.userSchool.updateMany({
              where: { userId: user.id, schoolId },
              data: { staffId: teacher.id }
            });

            await tx.usageRecord.updateMany({
              where: { schoolId },
              data: { currentStaff: { increment: 1 } }
            });
          });
          
          importedCount++;
        } catch (err: any) {
          console.error(`Failed to import teacher ${row.email}:`, err);
          skippedCount++;
          rejectedRows.push({ row, error: err.message || "DB transaction failed." });
        }
      }
      
      return { success: true, imported: importedCount, skipped: skippedCount, rejectedRows };
    });
  } catch (e: any) {
    return { error: e.message || "Failed to import teachers" }
  }
}
