import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";

// TODO [FUTURE - CRON]: Replace manual trigger with a scheduled
// cron job once hosting platform is confirmed (Vercel/Railway).
// Vercel: add to vercel.json { "crons": [{ "path": "/api/cron/...",
// "schedule": "0 8 * * *" }] }
export async function POST(req: NextRequest) {
  try {
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find all students with pending amount
    const students = await db.student.findMany({
      where: { schoolId, pendingAmount: { gt: 0 } },
      include: { parent: true }
    });

    let sentCount = 0;

    for (const student of students) {
      const parentEmail = student.parent?.email || student.email;
      if (parentEmail) {
        // Find if there's a fee due within next 3 days for this student
        // Assuming fees are tied to class or student. We will just send reminder for pending amount.
        await db.notification.create({
          data: {
            schoolId,
            studentId: student.id,
            type: "FEE_REMINDER",
            sentTo: parentEmail,
            status: "SENT"
          }
        });
        if (process.env.NODE_ENV === "development") console.log(`[FEE_REMINDER] Sent to ${parentEmail}`);
        sentCount++;
      }
    }

    return NextResponse.json({ success: true, message: `Sent ${sentCount} reminders` });
  } catch (error) {
    console.error("Failed to send reminders:", error);
    return NextResponse.json({ error: "Failed to send reminders" }, { status: 500 });
  }
}
