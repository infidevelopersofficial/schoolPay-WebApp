import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileAuth } from "@/lib/mobile/auth";
import { mobileApiRateLimit } from "@/lib/mobile/rate-limit";
import { SurveyDTO } from "@/lib/mobile/dto";

export async function GET(request: Request) {
  try {
    const session = await requireMobileAuth();

    // Rate Limiting
    const rlResult = await mobileApiRateLimit.limit(session.userId);
    if (!rlResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // Fetch surveys
    // A more complex query could filter by audienceFilter, but for now we fetch PUBLISHED
    const surveysData = await prisma.survey.findMany({
      where: {
        schoolId: session.schoolId,
        status: "PUBLISHED",
      },
      orderBy: { createdAt: "desc" },
    });

    // Find which ones the user has already responded to
    const userResponses = await prisma.surveyResponse.findMany({
      where: {
        userId: session.userId,
        surveyId: { in: surveysData.map((s) => s.id) },
      },
      select: { surveyId: true },
    });

    const completedSurveyIds = new Set(userResponses.map((r) => r.surveyId));

    const pending: SurveyDTO[] = [];
    const completed: SurveyDTO[] = [];

    surveysData.forEach((s) => {
      const dto: SurveyDTO = {
        id: s.id,
        title: s.title,
        description: s.description,
        status: s.status,
        expiresAt: s.expiresAt?.toISOString() || null,
        createdAt: s.createdAt.toISOString(),
      };

      if (completedSurveyIds.has(s.id)) {
        completed.push(dto);
      } else {
        pending.push(dto);
      }
    });

    return NextResponse.json({
      pending,
      completed,
    });
  } catch (error: any) {
    if (error.name === "MobileAuthError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Mobile Surveys API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
