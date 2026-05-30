import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileAuth } from "@/lib/mobile/auth";
import { mobileApiRateLimit } from "@/lib/mobile/rate-limit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireMobileAuth();

    // Rate Limiting
    const rlResult = await mobileApiRateLimit.limit(session.userId);
    if (!rlResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const survey = await prisma.survey.findUnique({
      where: {
        id,
        schoolId: session.schoolId,
      },
      include: {
        questions: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            order: true,
            type: true,
            text: true,
            options: true,
            isRequired: true,
          },
        },
      },
    });

    if (!survey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }

    return NextResponse.json({ survey });
  } catch (error: any) {
    if (error.name === "MobileAuthError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Mobile Survey GET Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireMobileAuth();

    // Rate Limiting
    const rlResult = await mobileApiRateLimit.limit(session.userId);
    if (!rlResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const surveyId = id;

    // Check if already submitted
    const existing = await prisma.surveyResponse.findUnique({
      where: {
        surveyId_userId: {
          surveyId,
          userId: session.userId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You have already submitted this survey." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { answers } = body; // Array of { questionId, answer }

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Invalid answers format" }, { status: 400 });
    }

    // Save response
    const response = await prisma.surveyResponse.create({
      data: {
        surveyId,
        userId: session.userId,
        answers: {
          create: answers.map((a: any) => ({
            questionId: a.questionId,
            answer: a.answer,
          })),
        },
      },
    });

    return NextResponse.json({ success: true, responseId: response.id });
  } catch (error: any) {
    if (error.name === "MobileAuthError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Mobile Survey POST Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
