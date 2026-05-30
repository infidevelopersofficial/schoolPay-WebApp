import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherMobileAuth } from "@/lib/mobile/teacher-auth";
import { mobileApiRateLimit } from "@/lib/mobile/rate-limit";
import { TeacherResultDTO } from "@/lib/mobile/teacher-dto";
import { ResultStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const session = await requireTeacherMobileAuth();

    const rlResult = await mobileApiRateLimit.limit(session.userId);
    if (!rlResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const examId = searchParams.get("examId");

    if (!examId) {
      return NextResponse.json({ error: "examId is required" }, { status: 400 });
    }

    // Verify exam and ownership
    const exam = await prisma.exam.findUnique({
      where: {
        id: examId,
        schoolId: session.schoolId,
      },
      include: {
        batch: {
          include: {
            enrollments: {
              where: { status: "ACTIVE" },
              include: { student: true },
            },
          },
        },
      },
    });

    if (!exam || exam.teacherId !== session.teacherId) {
      return NextResponse.json(
        { error: "Forbidden: You do not have access to this exam." },
        { status: 403 }
      );
    }

    // Fetch existing results
    const resultsData = await prisma.result.findMany({
      where: {
        examId,
        schoolId: session.schoolId,
      },
    });

    const resultMap = new Map(resultsData.map((r) => [r.studentId, r]));

    const resultsSheet = exam.batch.enrollments.map((e) => {
      const existing = resultMap.get(e.student.id);
      return {
        studentId: e.student.id,
        name: e.student.name,
        result: existing
          ? {
              id: existing.id,
              marks: existing.marks,
              grade: existing.grade,
              status: existing.status,
            }
          : null,
      };
    });

    return NextResponse.json({
      exam: {
        id: exam.id,
        name: exam.name,
        maxMarks: exam.maxMarks,
        isLocked: exam.marksLocked,
      },
      results: resultsSheet,
    });
  } catch (error: any) {
    if (error.name === "TeacherMobileAuthError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Teacher Results GET Error:", error);
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
    const { examId, records } = body;
    // records: { studentId: string, marks: number | null, status?: ResultStatus }[]

    if (!examId || !Array.isArray(records)) {
      return NextResponse.json({ error: "examId and records are required" }, { status: 400 });
    }

    // Verify ownership and lock status
    const exam = await prisma.exam.findUnique({
      where: { id: examId, schoolId: session.schoolId },
    });

    if (!exam || exam.teacherId !== session.teacherId) {
      return NextResponse.json(
        { error: "Forbidden: You do not have access to this exam." },
        { status: 403 }
      );
    }

    if (exam.marksLocked) {
      return NextResponse.json(
        { error: "Marks are locked for this exam." },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      for (const record of records) {
        if (record.marks !== null && record.marks > exam.maxMarks) {
          throw new Error(`Marks for student ${record.studentId} exceed maxMarks (${exam.maxMarks})`);
        }

        const existing = await tx.result.findUnique({
          where: {
            examId_studentId: {
              examId,
              studentId: record.studentId,
            },
          },
        });

        const status = (record.status as ResultStatus) || (existing?.status ?? "DRAFT");

        if (existing) {
          await tx.result.update({
            where: { id: existing.id },
            data: {
              marks: record.marks,
              status,
              enteredById: session.userId,
            },
          });
        } else {
          await tx.result.create({
            data: {
              examId,
              studentId: record.studentId,
              sessionId: exam.sessionId,
              schoolId: session.schoolId,
              marks: record.marks,
              status,
              enteredById: session.userId,
            },
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.name === "TeacherMobileAuthError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Teacher Results POST Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: error.message?.includes("exceed maxMarks") ? 400 : 500 }
    );
  }
}
