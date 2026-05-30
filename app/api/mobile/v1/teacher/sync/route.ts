import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherMobileAuth } from "@/lib/mobile/teacher-auth";
import { mobileApiRateLimit } from "@/lib/mobile/rate-limit";
import { 
  TeacherAnnouncementDTO, 
  AssignmentDTO, 
  AttendanceSheetDTO 
} from "@/lib/mobile/teacher-dto";

export async function GET(request: Request) {
  try {
    const session = await requireTeacherMobileAuth();

    const rlResult = await mobileApiRateLimit.limit(session.userId);
    if (!rlResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const sinceParam = searchParams.get("since");

    if (!sinceParam) {
      return NextResponse.json({ error: "Missing 'since' timestamp" }, { status: 400 });
    }

    const sinceDate = new Date(sinceParam);
    if (isNaN(sinceDate.getTime())) {
      return NextResponse.json({ error: "Invalid 'since' timestamp format" }, { status: 400 });
    }

    // Identify teacher's batches for scoping
    const teacherBatches = await prisma.batch.findMany({
      where: {
        schoolId: session.schoolId,
        teacherId: session.teacherId,
        isActive: true,
      },
      select: { id: true, name: true },
    });
    const batchIds = teacherBatches.map((b) => b.id);

    // Fetch updated data concurrently
    const [notificationsData, announcementsData, assignmentsData, attendanceData] = await Promise.all([
      // 1. Notifications (disabled for now due to schema change)
      Promise.resolve([]),
      // 2. Announcements
      prisma.announcement.findMany({
        where: {
          schoolId: session.schoolId,
          isActive: true,
          updatedAt: { gt: sinceDate },
        },
      }),
      // 3. Assignments
      prisma.assignment.findMany({
        where: {
          schoolId: session.schoolId,
          batchId: { in: batchIds },
          updatedAt: { gt: sinceDate },
        },
      }),
      // 4. Attendance
      prisma.attendance.findMany({
        where: {
          schoolId: session.schoolId,
          batchId: { in: batchIds },
          updatedAt: { gt: sinceDate },
        },
        include: {
          student: { select: { name: true } },
          batch: { select: { name: true } },
        },
      }),
    ]);

    // Format Data
    const updatedNotifications: any[] = [];

    const updatedAnnouncements: TeacherAnnouncementDTO[] = announcementsData.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      category: a.category,
      priority: a.priority,
      date: a.date,
    }));

    const updatedAssignments: AssignmentDTO[] = assignmentsData.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      dueDate: a.dueDate.toISOString(),
      subjectId: a.subjectId,
      batchId: a.batchId,
    }));

    // Group attendance by batch and date
    const attendanceMap = new Map<string, AttendanceSheetDTO>();

    attendanceData.forEach((record) => {
      if (!record.batchId) return;
      const key = `${record.batchId}-${record.date.toISOString()}`;
      
      if (!attendanceMap.has(key)) {
        attendanceMap.set(key, {
          batchId: record.batchId,
          batchName: record.batch?.name || "",
          date: record.date.toISOString(),
          students: [],
        });
      }
      
      attendanceMap.get(key)!.students.push({
        studentId: record.studentId,
        name: record.student.name,
        status: record.status,
      });
    });

    const updatedAttendance = Array.from(attendanceMap.values());

    return NextResponse.json({
      lastSyncAt: new Date().toISOString(),
      updatedNotifications,
      updatedAnnouncements,
      updatedAssignments,
      updatedAttendance,
    });
  } catch (error: any) {
    if (error.name === "TeacherMobileAuthError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Teacher Sync API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
