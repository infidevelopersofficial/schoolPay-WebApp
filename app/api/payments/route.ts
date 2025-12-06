import { mockPayments } from "@/lib/db/mockData"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return NextResponse.json(mockPayments)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const newPayment = { id: String(mockPayments.length + 1), ...data }
    return NextResponse.json(newPayment, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create payment" }, { status: 400 })
  }
}
