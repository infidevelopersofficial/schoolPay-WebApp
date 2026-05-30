import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherMobileAuth } from "@/lib/mobile/teacher-auth";
import { mobileApiRateLimit } from "@/lib/mobile/rate-limit";
import { TeacherStudentDTO } from "@/lib/mobile/teacher-dto";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const session = await requireTeacherMobileAuth();

    // Rate Limiting
    const rlResult = await mobileApiRateLimit.limit(session.userId);
    if (!rlResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Verify ownership of the batches/classes this teacher can see students from
    const teacherBatches = await prisma.batch.findMany({
      where: {
        schoolId: session.schoolId,
        teacherId: session.teacherId,
        isActive: true,
      },
      select: { id: true },
    });
    const validBatchIds = teacherBatches.map((b) => b.id);

    if (classId && !validBatchIds.includes(classId)) {
      return NextResponse.json(
        { error: "Forbidden: You do not have access to this class." },
        { status: 403 }
      );
    }

    const batchIdsToFilter = classId ? [classId] : validBatchIds;

    const whereClause: Prisma.StudentWhereInput = {
      schoolId: session.schoolId,
      enrollments: {
        some: {
          batchId: { in: batchIdsToFilter },
          status: "ACTIVE",
        },
      },
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { rollNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const [studentsData, totalCount] = await Promise.all([
      prisma.student.findMany({
        where: whereClause,
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.student.count({
        where: whereClause,
      }),
    ]);

    const students: TeacherStudentDTO[] = studentsData.map((s) => ({
      id: s.id,
      name: s.name,
      rollNumber: s.rollNumber,
      avatar: s.avatar,
    }));

    return NextResponse.json({
      students,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    if (error.name === "TeacherMobileAuthError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Teacher Students Directory API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
