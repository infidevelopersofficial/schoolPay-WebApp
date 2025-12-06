import { mockClasses } from "@/lib/db/mockData"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return NextResponse.json(mockClasses)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const newClass = { id: String(mockClasses.length + 1), ...data }
    return NextResponse.json(newClass, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create class" }, { status: 400 })
  }
}
