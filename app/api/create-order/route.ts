import { NextResponse } from "next/server"
import Razorpay from "razorpay"

/**
 * STEP 1: BACKEND - Create Order
 * Endpoint: POST /api/create-order
 * Request: { amount (in paise), currency, receipt }
 * Return: { order_id, amount, currency }
 * Minimum amount: 100 paise
 */
export async function POST(req: Request) {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: "Razorpay API credentials missing in environment configuration" },
        { status: 401 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const { amount, currency = "INR", receipt = `rcpt_${Date.now()}` } = body

    // Validate amount >= 100 paise (₹1.00)
    if (typeof amount !== "number" || isNaN(amount) || amount < 100) {
      return NextResponse.json(
        { error: "Invalid payment amount. Minimum amount allowed is 100 paise (₹1.00)." },
        { status: 400 }
      )
    }

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })

    const order = await instance.orders.create({
      amount: Math.round(amount),
      currency: String(currency).toUpperCase(),
      receipt: String(receipt),
    })

    if (!order || !order.id) {
      return NextResponse.json(
        { error: "Failed to generate order from Razorpay gateway" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    })
  } catch (error: any) {
    console.error("Razorpay create-order endpoint error:", error)
    if (error?.statusCode === 401 || error?.error?.code === "BAD_REQUEST_ERROR") {
      return NextResponse.json(
        { error: error?.error?.description || "Authentication failure with Razorpay API gateway" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: error?.message || "Internal server error occurred while creating Razorpay order" },
      { status: 500 }
    )
  }
}
