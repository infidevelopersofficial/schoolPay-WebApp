import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { DevicePlatform } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const userId = user.id;
    const schoolId = user.activeSchoolId as string;

    if (!schoolId) {
      return NextResponse.json({ error: "No active school context" }, { status: 400 });
    }

    const body = await request.json();
    const { token, platform, appVersion, deviceModel } = body;

    if (!token || !platform) {
      return NextResponse.json(
        { error: "token and platform are required" },
        { status: 400 }
      );
    }

    if (!Object.values(DevicePlatform).includes(platform as DevicePlatform)) {
      return NextResponse.json(
        { error: "Invalid platform. Must be ANDROID or IOS." },
        { status: 400 }
      );
    }

    // Verify tenant
    const userSchool = await prisma.userSchool.findUnique({
      where: {
        userId_schoolId: { userId, schoolId },
      },
    });

    if (!userSchool) {
      return NextResponse.json(
        { error: "Forbidden: You do not have access to this school." },
        { status: 403 }
      );
    }

    await prisma.userDevice.upsert({
      where: { deviceToken: token },
      update: {
        userId,
        schoolId,
        platform: platform as DevicePlatform,
        appVersion,
        deviceModel,
        isActive: true,
        lastSeenAt: new Date(),
      },
      create: {
        userId,
        schoolId,
        deviceToken: token,
        platform: platform as DevicePlatform,
        appVersion,
        deviceModel,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Device Register API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
