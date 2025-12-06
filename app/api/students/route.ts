import { mockStudents } from "@/lib/db/mockData"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300))
    return NextResponse.json(mockStudents)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    // In production, save to database
    const newStudent = { id: String(mockStudents.length + 1), ...data }
    return NextResponse.json(newStudent, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create student" }, { status: 400 })
  }
}
