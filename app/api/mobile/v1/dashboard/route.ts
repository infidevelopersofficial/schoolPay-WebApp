import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileAuth } from "@/lib/mobile/auth";
import { mobileApiRateLimit } from "@/lib/mobile/rate-limit";
import { StudentDTO } from "@/lib/mobile/dto";

export async function GET(request: Request) {
  try {
    const session = await requireMobileAuth();

    // Rate Limiting
    const rlResult = await mobileApiRateLimit.limit(session.userId);
    if (!rlResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // 1. Fetch Students
    const studentsData = await prisma.student.findMany({
      where: {
        parentId: session.parentId,
        schoolId: session.schoolId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        class: true,
        section: true,
        admissionNumber: true,
        rollNumber: true,
      },
    });

    const students: StudentDTO[] = studentsData.map((s) => ({
      id: s.id,
      name: s.name,
      avatar: s.avatar,
      class: s.class,
      section: s.section,
      admissionNumber: s.admissionNumber,
      rollNumber: s.rollNumber,
    }));

    const studentIds = students.map((s) => s.id);

    // 2. Concurrently fetch aggregated metrics for these students
    const [
      pendingInvoices,
      unreadNotifications,
      upcomingExams,
      attendanceRecords,
      recentPayments,
    ] = await Promise.all([
      // Pending Fees
      prisma.invoice.findMany({
        where: {
          studentId: { in: studentIds },
          schoolId: session.schoolId,
          status: { in: ["SENT", "OVERDUE"] },
        },
        select: { total: true },
      }),
      // Unread Notifications
      Promise.resolve(0),
      // Upcoming Exams (next 30 days)
      prisma.exam.findMany({
        where: {
          schoolId: session.schoolId,
          date: {
            gte: new Date().toISOString().split("T")[0],
          },
        },
        select: {
          id: true,
          name: true,
          date: true,
          subject: { select: { name: true } },
        },
        orderBy: { date: "asc" },
        take: 5,
      }),
      // Attendance for calculating %
      prisma.attendance.findMany({
        where: {
          studentId: { in: studentIds },
          schoolId: session.schoolId,
        },
        select: { status: true },
      }),
      // Recent Payments
      prisma.payment.findMany({
        where: {
          studentId: { in: studentIds },
          schoolId: session.schoolId,
          status: "COMPLETED",
        },
        select: {
          id: true,
          amount: true,
          date: true,
        },
        orderBy: { date: "desc" },
        take: 5,
      }),
    ]);

    // Calculate pending amount
    const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.total, 0);

    // Calculate attendance %
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter((r) => r.status === "PRESENT").length;
    const attendanceRate = totalDays > 0 ? Number(((presentDays / totalDays) * 100).toFixed(1)) : 0;

    return NextResponse.json({
      students,
      attendanceRate,
      pendingAmount,
      unreadNotifications,
      upcomingExams,
      recentPayments,
    });
  } catch (error: any) {
    if (error.name === "MobileAuthError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Mobile Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
