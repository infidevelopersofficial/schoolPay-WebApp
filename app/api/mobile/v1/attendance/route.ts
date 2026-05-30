import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileAuth } from "@/lib/mobile/auth";
import { mobileApiRateLimit } from "@/lib/mobile/rate-limit";
import { AttendanceDTO } from "@/lib/mobile/dto";

export async function GET(request: Request) {
  try {
    const session = await requireMobileAuth();

    // Rate Limiting
    const rlResult = await mobileApiRateLimit.limit(session.userId);
    if (!rlResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const studentIdParam = searchParams.get("studentId");
    const monthParam = searchParams.get("month"); // Format: YYYY-MM

    // Verify student belongs to parent if studentId is provided
    let targetStudentIds: string[] = [];
    if (studentIdParam) {
      const student = await prisma.student.findFirst({
        where: {
          id: studentIdParam,
          parentId: session.parentId,
          schoolId: session.schoolId,
        },
      });
      if (!student) {
        return NextResponse.json({ error: "Student not found or unauthorized" }, { status: 404 });
      }
      targetStudentIds = [student.id];
    } else {
      const students = await prisma.student.findMany({
        where: {
          parentId: session.parentId,
          schoolId: session.schoolId,
        },
        select: { id: true },
      });
      targetStudentIds = students.map((s) => s.id);
    }

    if (targetStudentIds.length === 0) {
      return NextResponse.json({ attendanceRate: 0, records: [] });
    }

    // Build query
    const whereClause: any = {
      studentId: { in: targetStudentIds },
      schoolId: session.schoolId,
    };

    if (monthParam) {
      const startDate = new Date(`${monthParam}-01T00:00:00.000Z`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999);
      whereClause.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    // Fetch records
    const attendanceData = await prisma.attendance.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
    });

    const records: AttendanceDTO[] = attendanceData.map((a) => ({
      id: a.id,
      date: a.date.toISOString(),
      status: a.status,
      remarks: a.remarks,
    }));

    // Calculate rate
    const totalDays = records.length;
    const presentDays = records.filter((r) => r.status === "PRESENT").length;
    const attendanceRate = totalDays > 0 ? Number(((presentDays / totalDays) * 100).toFixed(1)) : 0;

    return NextResponse.json({
      attendanceRate,
      records,
    });
  } catch (error: any) {
    if (error.name === "MobileAuthError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Mobile Attendance API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
