import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileAuth } from "@/lib/mobile/auth";
import { mobileApiRateLimit } from "@/lib/mobile/rate-limit";
import { AnnouncementDTO } from "@/lib/mobile/dto";

export async function GET(request: Request) {
  try {
    const session = await requireMobileAuth();

    // Rate Limiting
    const rlResult = await mobileApiRateLimit.limit(session.userId);
    if (!rlResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Fetch announcements that are active
    const announcementsData = await prisma.announcement.findMany({
      where: {
        schoolId: session.schoolId,
        isActive: true,
        // Additional filtering could be added here to only show announcements targeting PARENTs
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

    const announcements: AnnouncementDTO[] = announcementsData.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      category: a.category,
      priority: a.priority,
      publishedAt: a.date,
      authorName: a.author || "School Admin",
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
    if (error.name === "MobileAuthError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Mobile Announcements API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
