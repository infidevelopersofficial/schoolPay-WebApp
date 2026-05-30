import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherMobileAuth } from "@/lib/mobile/teacher-auth";
import { mobileApiRateLimit } from "@/lib/mobile/rate-limit";
import { TeacherDashboardDTO } from "@/lib/mobile/teacher-dto";

export async function GET(request: Request) {
  try {
    const session = await requireTeacherMobileAuth();

    // Rate Limiting
    const rlResult = await mobileApiRateLimit.limit(session.userId);
    if (!rlResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // A teacher can lead batches (as batch.teacherId)
    // We fetch their batches to calculate total students.
    const batches = await prisma.batch.findMany({
      where: {
        schoolId: session.schoolId,
        teacherId: session.teacherId,
        isActive: true,
      },
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
    });

    const totalStudents = batches.reduce((acc, batch) => acc + batch._count.enrollments, 0);

    // Get today's date at midnight for attendance check
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Count how many batches need attendance marked today
    // A batch needs attendance if there is no AttendanceRegister for today that is SUBMITTED or LOCKED
    const batchIds = batches.map((b) => b.id);
    const attendanceRegistersToday = await prisma.attendanceRegister.findMany({
      where: {
        schoolId: session.schoolId,
        batchId: { in: batchIds },
        date: { gte: today },
        status: { in: ["SUBMITTED", "LOCKED"] },
      },
    });

    const attendancePending = batches.length - attendanceRegistersToday.length;

    // Upcoming exams for these batches
    const upcomingExams = await prisma.exam.findMany({
      where: {
        schoolId: session.schoolId,
        batchId: { in: batchIds },
        date: { gte: today.toISOString() }, // simple string comparison assuming YYYY-MM-DD
      },
      orderBy: { date: "asc" },
      take: 3,
      select: {
        id: true,
        name: true,
        date: true,
        subject: { select: { name: true } },
      },
    });

    // Recent announcements (targeting TEACHER or GLOBAL)
    // Here we just fetch active announcements
    const recentAnnouncements = await prisma.announcement.findMany({
      where: {
        schoolId: session.schoolId,
        isActive: true,
      },
      orderBy: { date: "desc" },
      take: 3,
      select: {
        id: true,
        title: true,
        date: true,
      },
    });

    // Assignments pending (due in the future)
    const pendingAssignmentsCount = await prisma.assignment.count({
      where: {
        schoolId: session.schoolId,
        batchId: { in: batchIds },
        dueDate: { gte: today },
      },
    });

    const dashboard: TeacherDashboardDTO = {
      classes: batches.length,
      students: totalStudents,
      attendancePending: Math.max(0, attendancePending),
      assignmentsPending: pendingAssignmentsCount,
      upcomingExams,
      recentAnnouncements,
    };

    return NextResponse.json(dashboard);
  } catch (error: any) {
    if (error.name === "TeacherMobileAuthError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Teacher Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
