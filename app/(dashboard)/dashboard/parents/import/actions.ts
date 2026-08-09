"use server"

import { withTenantAuth } from "@/lib/tenant-auth"
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSchoolId } from "@/lib/tenant-context";
import { hash } from "bcryptjs";
import { createParentSchema } from "@/lib/dal/parents";

export async function importParentsBatchAction(batch: any[]) {
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

      const validParents = [];

      for (const row of batch) {
        // Validation using safeParse
        const parsed = createParentSchema.safeParse(row);
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
        validParents.push(parsed.data);
      }
      
      // 2. Safely create each Parent + User atomically, sequentially
      for (const row of validParents) {
        try {
          await prisma.$transaction(async (tx) => {
            const defaultPassword = await hash(row.phone, 10);
            
            const user = await tx.user.create({
              data: {
                name: row.name,
                email: row.email,
                phone: row.phone,
                hashedPassword: defaultPassword,
                role: "PARENT",
                schools: {
                  create: { schoolId, role: "PARENT" }
                }
              }
            });

            await tx.parent.create({
              data: {
                schoolId,
                name: row.name,
                email: row.email,
                mobile: row.phone, // phone maps to mobile in parent table
                relationship: row.relationship,
                occupation: row.occupation,
                address: row.address,
                userId: user.id
              }
            });
          });
          
          importedCount++;
        } catch (err: any) {
          console.error(`Failed to import parent ${row.email}:`, err);
          skippedCount++;
          rejectedRows.push({ row, error: err.message || "DB transaction failed." });
        }
      }
      
      return { success: true, imported: importedCount, skipped: skippedCount, rejectedRows };
    });
  } catch (e: any) {
    return { error: e.message || "Failed to import parents" }
  }
}
