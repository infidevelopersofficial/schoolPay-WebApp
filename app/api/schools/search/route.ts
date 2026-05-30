import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")

    if (!q || q.length < 2) {
      return NextResponse.json({ schools: [] })
    }

    const schools = await prisma.school.findMany({
      where: {
        name: {
          contains: q,
          mode: "insensitive",
        },
        isActive: true,
      },
      select: {
        schoolCode: true,
        name: true,
        city: true,
      },
      take: 5,
    })

    return NextResponse.json({ schools })
  } catch (error) {
    console.error("School search error:", error)
    return NextResponse.json({ error: "Failed to search schools" }, { status: 500 })
  }
}
