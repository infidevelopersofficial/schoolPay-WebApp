import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherMobileAuth } from "@/lib/mobile/teacher-auth";
import { mobileApiRateLimit } from "@/lib/mobile/rate-limit";
import { TeacherAnnouncementDTO } from "@/lib/mobile/teacher-dto";

export async function GET(request: Request) {
  try {
    const session = await requireTeacherMobileAuth();

    const rlResult = await mobileApiRateLimit.limit(session.userId);
    if (!rlResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const announcementsData = await prisma.announcement.findMany({
      where: {
        schoolId: session.schoolId,
        isActive: true,
      },
      orderBy: { date: "desc" },
      skip,
      take: limit,
    });

    const totalCount = await prisma.announcement.count({
      where: {
        schoolId: session.schoolId,
        isActive: true,
      },
    });

    const announcements: TeacherAnnouncementDTO[] = announcementsData.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      category: a.category,
      priority: a.priority,
      date: a.date,
    }));

    return NextResponse.json({
      announcements,
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
    console.error("Teacher Announcements GET Error:", error);
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
    const { title, content, priority, category, targetAudience, expiryDate } = body;

    if (!title || !content || !priority || !category || !targetAudience) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: session.teacherId },
      select: { name: true },
    });

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        priority,
        category,
        targetAudience,
        date: new Date().toISOString().split("T")[0],
        author: teacher?.name || "Teacher",
        expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
        schoolId: session.schoolId,
      },
    });

    return NextResponse.json({ success: true, announcementId: announcement.id });
  } catch (error: any) {
    if (error.name === "TeacherMobileAuthError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Teacher Announcements POST Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
