import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileAuth } from "@/lib/mobile/auth";
import { mobileApiRateLimit } from "@/lib/mobile/rate-limit";
import { ExamResultDTO } from "@/lib/mobile/dto";

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

    // Verify student belongs to parent
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
      return NextResponse.json({ exams: [], results: [], averagePercentage: 0 });
    }

    // Fetch published results
    const resultsData = await prisma.result.findMany({
      where: {
        studentId: { in: targetStudentIds },
        schoolId: session.schoolId,
        status: "PUBLISHED",
      },
      include: {
        exam: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: {
        exam: {
          date: "desc",
        },
      },
    });

    const results: ExamResultDTO[] = resultsData.map((r) => ({
      id: r.id,
      examName: r.exam.name,
      subject: r.exam.subject.name,
      date: r.exam.date,
      maxMarks: r.exam.maxMarks,
      marksObtained: r.marks,
      grade: r.grade,
      status: r.status,
      remarks: r.remarks,
    }));

    // Calculate average percentage
    let totalMaxMarks = 0;
    let totalObtainedMarks = 0;
    resultsData.forEach((r) => {
      if (r.marks !== null) {
        totalMaxMarks += r.exam.maxMarks;
        totalObtainedMarks += r.marks;
      }
    });

    const averagePercentage = totalMaxMarks > 0 ? Number(((totalObtainedMarks / totalMaxMarks) * 100).toFixed(1)) : 0;

    return NextResponse.json({
      exams: Array.from(new Set(results.map(r => r.examName))), // Simple list of unique exams
      results,
      averagePercentage,
    });
  } catch (error: any) {
    if (error.name === "MobileAuthError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Mobile Results API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
