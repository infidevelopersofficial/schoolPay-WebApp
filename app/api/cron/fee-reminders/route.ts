import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // 1. Verify Vercel Cron Secret for security
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch all active students across ALL schools with pending amounts
    const students = await db.student.findMany({
      where: { 
        pendingAmount: { gt: 0 },
        isActive: true,
        accountStatus: "ACTIVE"
      },
      include: { parent: true }
    });

    let sentCount = 0;

    for (const student of students) {
      const parentEmail = student.parent?.email || student.email;
      if (parentEmail) {
        // Create a notification record (this could also dispatch an actual SMS/Email)
        await db.notification.create({
          data: {
            schoolId: student.schoolId,
            studentId: student.id,
            type: "FEE_REMINDER",
            sentTo: parentEmail,
            status: "SENT"
          }
        });
        
        // Log for development
        if (process.env.NODE_ENV === "development") {
          console.log(`[CRON] [FEE_REMINDER] Sent to ${parentEmail} for student ${student.name} (Amount Pending: ${student.pendingAmount})`);
        }
        
        sentCount++;
      }
    }

    return NextResponse.json({ success: true, message: `Cron successfully dispatched ${sentCount} global fee reminders` });
  } catch (error: any) {
    console.error("Global fee reminder cron failed:", error);
    return NextResponse.json({ error: error.message || "Failed to run cron" }, { status: 500 });
  }
}
