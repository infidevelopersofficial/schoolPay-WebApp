import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/prisma";
import { verifyCronAuth } from "@/lib/utils/cron-auth";

const BATCH_SIZE = 500;

export async function GET(req: NextRequest) {
  try {
    // 1. Mandatory fail-closed CRON_SECRET authentication
    const authError = verifyCronAuth(req);
    if (authError) return authError;

    let sentCount = 0;
    let cursorId: string | undefined = undefined;

    // 2. Fetch active students with pending fees using cursor-based pagination
    // to maintain constant memory usage regardless of total database size.
    while (true) {
      const students: any[] = await db.student.findMany({
        where: { 
          pendingAmount: { gt: 0 },
          isActive: true,
          accountStatus: "ACTIVE"
        },
        take: BATCH_SIZE,
        skip: cursorId ? 1 : 0,
        cursor: cursorId ? ({ id: cursorId } as any) : undefined,
        orderBy: { id: "asc" },
        include: { parent: true }
      });

      if (students.length === 0) break;

      for (const student of students) {
        const parentEmail = student.parent?.email || student.email;
        if (parentEmail) {
          await db.notification.create({
            data: {
              schoolId: student.schoolId,
              studentId: student.id,
              type: "FEE_REMINDER",
              sentTo: parentEmail,
              status: "SENT"
            }
          });
          
          if (process.env.NODE_ENV === "development") {
            console.log(`[CRON] [FEE_REMINDER] Sent to ${parentEmail} for student ${student.name} (Amount Pending: ${student.pendingAmount})`);
          }
          
          sentCount++;
        }
      }

      cursorId = students[students.length - 1].id;
      if (students.length < BATCH_SIZE) break;
    }

    return NextResponse.json({ success: true, message: `Cron successfully dispatched ${sentCount} global fee reminders` });
  } catch (error: any) {
    console.error("Global fee reminder cron failed:", error);
    return NextResponse.json({ error: error.message || "Failed to run cron" }, { status: 500 });
  }
}

