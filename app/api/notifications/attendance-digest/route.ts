import { NextRequest, NextResponse } from "next/server";
import { prisma as db } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";

export async function POST(req: NextRequest) {
  try {
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const absentRecords = await db.attendance.findMany({
      where: {
        schoolId,
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
          await db.notification.create({
            data: {
              schoolId,
              studentId: record.studentId,
              type: "ATTENDANCE_ALERT",
              sentTo: parentEmail,
              status: "SENT"
            }
          });
          if (process.env.NODE_ENV === "development") console.log(`[ATTENDANCE_ALERT] Sent to ${parentEmail} for ${record.student.name}`);
          sentCount++;
        }
      }
    }

    return NextResponse.json({ success: true, message: `Sent ${sentCount} attendance alerts` });
  } catch (error) {
    console.error("Failed to send attendance digest:", error);
    return NextResponse.json({ error: "Failed to send attendance digest" }, { status: 500 });
  }
}
