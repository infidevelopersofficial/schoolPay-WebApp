import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherMobileAuth } from "@/lib/mobile/teacher-auth";
import { mobileApiRateLimit } from "@/lib/mobile/rate-limit";
import { AssignmentDTO } from "@/lib/mobile/teacher-dto";

export async function GET(request: Request) {
  try {
    const session = await requireTeacherMobileAuth();

    const rlResult = await mobileApiRateLimit.limit(session.userId);
    if (!rlResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get("batchId");

    const teacherBatches = await prisma.batch.findMany({
      where: { schoolId: session.schoolId, teacherId: session.teacherId },
      select: { id: true },
    });
    const batchIds = teacherBatches.map((b) => b.id);

    if (batchId && !batchIds.includes(batchId)) {
      return NextResponse.json(
        { error: "Forbidden: You do not have access to this class." },
        { status: 403 }
      );
    }

    const targetBatchIds = batchId ? [batchId] : batchIds;

    const assignmentsData = await prisma.assignment.findMany({
      where: {
        schoolId: session.schoolId,
        batchId: { in: targetBatchIds },
      },
      orderBy: { dueDate: "asc" },
    });

    const assignments: AssignmentDTO[] = assignmentsData.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      dueDate: a.dueDate.toISOString(),
      subjectId: a.subjectId,
      batchId: a.batchId,
    }));

    return NextResponse.json({ assignments });
  } catch (error: any) {
    if (error.name === "TeacherMobileAuthError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Teacher Assignments GET Error:", error);
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
    const { title, description, dueDate, subjectId, batchId } = body;

    if (!title || !dueDate || !subjectId || !batchId) {
      return NextResponse.json(
        { error: "title, dueDate, subjectId, and batchId are required" },
        { status: 400 }
      );
    }

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

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        subjectId,
        batchId,
        schoolId: session.schoolId,
      },
    });

    return NextResponse.json({ success: true, assignmentId: assignment.id });
  } catch (error: any) {
    if (error.name === "TeacherMobileAuthError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Teacher Assignments POST Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
