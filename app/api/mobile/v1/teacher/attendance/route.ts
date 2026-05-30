import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherMobileAuth } from "@/lib/mobile/teacher-auth";
import { mobileApiRateLimit } from "@/lib/mobile/rate-limit";
import { AttendanceSheetDTO } from "@/lib/mobile/teacher-dto";
import { AttendanceStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const session = await requireTeacherMobileAuth();

    const rlResult = await mobileApiRateLimit.limit(session.userId);
    if (!rlResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get("batchId");
    const dateParam = searchParams.get("date"); // YYYY-MM-DD

    if (!batchId || !dateParam) {
      return NextResponse.json(
        { error: "batchId and date are required" },
        { status: 400 }
      );
    }

    const date = new Date(dateParam);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    // Verify ownership
    const batch = await prisma.batch.findUnique({
      where: {
        id: batchId,
        schoolId: session.schoolId,
      },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          include: { student: true },
        },
      },
    });

    if (!batch || batch.teacherId !== session.teacherId) {
      return NextResponse.json(
        { error: "Forbidden: You do not have access to this class." },
        { status: 403 }
      );
    }

    // Fetch existing attendance records for that day
    const records = await prisma.attendance.findMany({
      where: {
        batchId,
        schoolId: session.schoolId,
        date,
      },
    });

    const recordMap = new Map(records.map((r) => [r.studentId, r.status]));

    const sheet: AttendanceSheetDTO = {
      batchId: batch.id,
      batchName: batch.name,
      date: date.toISOString(),
      students: batch.enrollments.map((e) => ({
        studentId: e.student.id,
        name: e.student.name,
        status: recordMap.get(e.student.id) || null,
      })),
    };

    return NextResponse.json({ sheet });
  } catch (error: any) {
    if (error.name === "TeacherMobileAuthError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Teacher Attendance GET Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireTeacherMobileAuth();

    const rlResult = await mobileApiRateLimit.limit(session.userId);
    if (!rlResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const { batchId, date, records } = body; 
    // records: { studentId: string, status: AttendanceStatus }[]

    if (!batchId || !date || !Array.isArray(records)) {
      return NextResponse.json(
        { error: "batchId, date, and records array are required" },
        { status: 400 }
      );
    }

    const attendanceDate = new Date(date);

    // Verify ownership
    const batch = await prisma.batch.findUnique({
      where: { id: batchId, schoolId: session.schoolId },
    });

    if (!batch || batch.teacherId !== session.teacherId) {
      return NextResponse.json(
        { error: "Forbidden: You do not have access to this class." },
        { status: 403 }
      );
    }

    // We process attendance in a transaction to prevent partial updates
    await prisma.$transaction(async (tx) => {
      // 1. Delete existing records for this batch and date to prevent duplicates
      await tx.attendance.deleteMany({
        where: {
          batchId,
          schoolId: session.schoolId,
          date: attendanceDate,
        },
      });

      // 2. Create new records
      if (records.length > 0) {
        await tx.attendance.createMany({
          data: records.map((r) => ({
            studentId: r.studentId,
            date: attendanceDate,
            status: r.status as AttendanceStatus,
            batchId,
            schoolId: session.schoolId,
            recordedBy: session.userId,
          })),
        });
      }

      // 3. Upsert AttendanceRegister
      const presentCount = records.filter(
        (r) => r.status === "PRESENT" || r.status === "LATE" || r.status === "HALF_DAY"
      ).length;
      const absentCount = records.filter((r) => r.status === "ABSENT").length;
      const lateCount = records.filter((r) => r.status === "LATE").length;

      const register = await tx.attendanceRegister.findUnique({
        where: {
          batchId_date_schoolId: {
            batchId,
            date: attendanceDate,
            schoolId: session.schoolId,
          },
        },
      });

      if (register) {
        await tx.attendanceRegister.update({
          where: { id: register.id },
          data: {
            status: "SUBMITTED",
            totalStudents: records.length,
            presentCount,
            absentCount,
            lateCount,
            submittedBy: session.userId,
            submittedAt: new Date(),
          },
        });
      } else {
        await tx.attendanceRegister.create({
          data: {
            batchId,
            date: attendanceDate,
            schoolId: session.schoolId,
            status: "SUBMITTED",
            totalStudents: records.length,
            presentCount,
            absentCount,
            lateCount,
            submittedBy: session.userId,
            submittedAt: new Date(),
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.name === "TeacherMobileAuthError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Teacher Attendance POST Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
