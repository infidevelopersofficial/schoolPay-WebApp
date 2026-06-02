import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // 1. Verify Vercel Cron Secret for security
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get today's start and end date bounds for filtering
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 2. Fetch all absences recorded today
    const absentRecords = await db.attendance.findMany({
      where: {
        status: "ABSENT",
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        student: {
          include: { parent: true }
        }
      }
    });

    let sentCount = 0;

    for (const record of absentRecords) {
      if (record.student && record.student.isActive) {
        const parentEmail = record.student.parent?.email || record.student.email;
        if (parentEmail) {
          // Create a notification record (this could also dispatch an actual SMS/Email)
          await db.notification.create({
            data: {
              schoolId: record.schoolId,
              studentId: record.studentId,
              type: "ATTENDANCE_ALERT",
              sentTo: parentEmail,
              status: "SENT"
            }
          });
          
          // Log for development
          if (process.env.NODE_ENV === "development") {
            console.log(`[CRON] [ATTENDANCE_ALERT] Sent to ${parentEmail} for absent student ${record.student.name}`);
          }
          
          sentCount++;
        }
      }
    }

    return NextResponse.json({ success: true, message: `Cron successfully dispatched ${sentCount} absence alerts` });
  } catch (error: any) {
    console.error("Global attendance digest cron failed:", error);
    return NextResponse.json({ error: error.message || "Failed to run cron" }, { status: 500 });
  }
}
