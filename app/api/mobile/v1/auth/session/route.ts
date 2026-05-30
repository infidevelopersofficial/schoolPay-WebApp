import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMobileAuth } from "@/lib/mobile/auth";
import { mobileApiRateLimit } from "@/lib/mobile/rate-limit";

export async function GET(request: Request) {
  try {
    const session = await requireMobileAuth();

    // Rate Limiting
    const rlResult = await mobileApiRateLimit.limit(session.userId);
    if (!rlResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // Fetch user details
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch schools where the user is a PARENT
    const memberships = await prisma.userSchool.findMany({
      where: {
        userId: session.userId,
        role: "PARENT",
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            primaryColor: true,
          },
        },
      },
    });

    const schools = memberships.map((m) => m.school);
    const activeSchool = schools.find((s) => s.id === session.schoolId) || schools[0];

    return NextResponse.json({
      user,
      schools,
      activeSchool,
    });
  } catch (error: any) {
    if (error.name === "MobileAuthError") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Mobile Auth Session Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
