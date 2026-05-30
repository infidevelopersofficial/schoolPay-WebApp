import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherMobileAuth } from "@/lib/mobile/teacher-auth";
import { mobileApiRateLimit } from "@/lib/mobile/rate-limit";
import { TeacherClassDTO } from "@/lib/mobile/teacher-dto";

export async function GET(request: Request) {
  try {
    const session = await requireTeacherMobileAuth();

    // Rate Limiting
    const rlResult = await mobileApiRateLimit.limit(session.userId);
    if (!rlResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

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
      orderBy: { name: "asc" },
    });

    const classes: TeacherClassDTO[] = batches.map((b) => ({
      id: b.id,
      name: b.name,
      section: b.section || "",
      grade: b.grade,
      subjectFocus: b.subjectFocus,
      capacity: b.capacity,
      studentCount: b._count.enrollments,
      isClassTeacher: true, // as they own this batch
    }));

    return NextResponse.json({ classes });
  } catch (error: any) {
    if (error.name === "TeacherMobileAuthError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Teacher Classes API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
