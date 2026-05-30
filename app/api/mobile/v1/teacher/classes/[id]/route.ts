import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherMobileAuth } from "@/lib/mobile/teacher-auth";
import { mobileApiRateLimit } from "@/lib/mobile/rate-limit";
import { TeacherClassDTO, TeacherStudentDTO } from "@/lib/mobile/teacher-dto";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireTeacherMobileAuth();

    // Rate Limiting
    const rlResult = await mobileApiRateLimit.limit(session.userId);
    if (!rlResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const batch = await prisma.batch.findUnique({
      where: {
        id,
        schoolId: session.schoolId,
      },
      include: {
        _count: {
          select: { enrollments: true },
        },
        enrollments: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!batch) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Ownership Validation
    if (batch.teacherId !== session.teacherId) {
      return NextResponse.json(
        { error: "Forbidden: You do not have access to this class." },
        { status: 403 }
      );
    }

    const classDto: TeacherClassDTO = {
      id: batch.id,
      name: batch.name,
      section: batch.section || "",
      grade: batch.grade,
      subjectFocus: batch.subjectFocus,
      capacity: batch.capacity,
      studentCount: batch._count.enrollments,
      isClassTeacher: true,
    };

    const students: TeacherStudentDTO[] = batch.enrollments.map((e) => ({
      id: e.student.id,
      name: e.student.name,
      rollNumber: e.student.rollNumber,
      avatar: e.student.avatar,
    }));

    return NextResponse.json({
      class: classDto,
      students,
    });
  } catch (error: any) {
    if (error.name === "TeacherMobileAuthError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Teacher Class Detail API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
