import { mockTeachers } from "@/lib/db/mockData"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return NextResponse.json(mockTeachers)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch teachers" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const newTeacher = { id: String(mockTeachers.length + 1), ...data }
    return NextResponse.json(newTeacher, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create teacher" }, { status: 400 })
  }
}
