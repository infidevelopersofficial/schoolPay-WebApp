import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherMobileAuth } from "@/lib/mobile/teacher-auth";
import { mobileApiRateLimit } from "@/lib/mobile/rate-limit";
import { AssignmentDTO } from "@/lib/mobile/teacher-dto";

async function getAssignmentWithOwnerValidation(
  id: string,
  schoolId: string,
  teacherId: string
) {
  const assignment = await prisma.assignment.findUnique({
    where: { id, schoolId },
    include: { batch: true },
  });

  if (!assignment) {
    return { error: "Assignment not found", status: 404 };
  }

  if (assignment.batch.teacherId !== teacherId) {
    return { error: "Forbidden: You do not own this assignment.", status: 403 };
  }

  return { assignment };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireTeacherMobileAuth();

    const rlResult = await mobileApiRateLimit.limit(session.userId);
    if (!rlResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const result = await getAssignmentWithOwnerValidation(
      id,
      session.schoolId,
      session.teacherId
    );
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { assignment } = result;

    const dto: AssignmentDTO = {
      id: assignment!.id,
      title: assignment!.title,
      description: assignment!.description,
      dueDate: assignment!.dueDate.toISOString(),
      subjectId: assignment!.subjectId,
      batchId: assignment!.batchId,
    };

    return NextResponse.json({ assignment: dto });
  } catch (error: any) {
    if (error.name === "TeacherMobileAuthError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Teacher Assignment Detail GET Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireTeacherMobileAuth();

    const rlResult = await mobileApiRateLimit.limit(session.userId);
    if (!rlResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const result = await getAssignmentWithOwnerValidation(
      id,
      session.schoolId,
      session.teacherId
    );
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const body = await request.json();
    const { title, description, dueDate, subjectId } = body;

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (dueDate) updateData.dueDate = new Date(dueDate);
    if (subjectId) updateData.subjectId = subjectId;

    await prisma.assignment.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.name === "TeacherMobileAuthError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Teacher Assignment Detail PATCH Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireTeacherMobileAuth();

    const rlResult = await mobileApiRateLimit.limit(session.userId);
    if (!rlResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const result = await getAssignmentWithOwnerValidation(
      id,
      session.schoolId,
      session.teacherId
    );
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    await prisma.assignment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.name === "TeacherMobileAuthError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Teacher Assignment Detail DELETE Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
