import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const userId = user.id;

    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "token is required in query params" },
        { status: 400 }
      );
    }

    // Verify ownership and delete or deactivate
    const device = await prisma.userDevice.findUnique({
      where: { deviceToken: token },
    });

    if (device && device.userId === userId) {
      await prisma.userDevice.delete({
        where: { deviceToken: token },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Device Unregister API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
