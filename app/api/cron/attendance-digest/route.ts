import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/prisma";
import { verifyCronAuth } from "@/lib/utils/cron-auth";

const BATCH_SIZE = 500;

export async function GET(req: NextRequest) {
  try {
    // 1. Mandatory fail-closed CRON_SECRET authentication
    const authError = verifyCronAuth(req);
    if (authError) return authError;

    // Get today's start and end date bounds for filtering
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let sentCount = 0;
    let cursorId: string | undefined = undefined;

    // 2. Fetch absences recorded today using cursor-based pagination
    // to maintain constant memory usage regardless of total database size.
    while (true) {
      const absentRecords: any[] = await db.attendance.findMany({
        where: {
          status: "ABSENT",
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        take: BATCH_SIZE,
        skip: cursorId ? 1 : 0,
        cursor: cursorId ? ({ id: cursorId } as any) : undefined,
        orderBy: { id: "asc" },
        include: {
          student: {
            include: { parent: true }
          }
        }
      });

      if (absentRecords.length === 0) break;

      for (const record of absentRecords) {
        if (record.student && record.student.isActive) {
          const parentEmail = record.student.parent?.email || record.student.email;
          if (parentEmail) {
            await db.notification.create({
              data: {
                schoolId: record.schoolId,
                studentId: record.studentId,
                type: "ATTENDANCE_ALERT",
                sentTo: parentEmail,
                status: "SENT"
              }
            });
            
            if (process.env.NODE_ENV === "development") {
              console.log(`[CRON] [ATTENDANCE_ALERT] Sent to ${parentEmail} for absent student ${record.student.name}`);
            }
            
            sentCount++;
          }
        }
      }

      cursorId = absentRecords[absentRecords.length - 1].id;
      if (absentRecords.length < BATCH_SIZE) break;
    }

    return NextResponse.json({ success: true, message: `Cron successfully dispatched ${sentCount} absence alerts` });
  } catch (error: any) {
    console.error("Global attendance digest cron failed:", error);
    return NextResponse.json({ error: error.message || "Failed to run cron" }, { status: 500 });
  }
}

