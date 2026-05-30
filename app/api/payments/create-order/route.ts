import { NextResponse } from "next/server"
import Razorpay from "razorpay"
import { redis } from "@/lib/redis"

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { name, city, state, adminEmail, adminPassword, plan } = data

    if (!name || !adminEmail || !adminPassword || !plan) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Determine amount based on plan
    let amount = 0
    if (plan === "STARTER") amount = 999 * 100 // amounts are in paise
    else if (plan === "GROWTH") amount = 2499 * 100
    else if (plan === "PRO") amount = 4999 * 100
    else {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: "Razorpay credentials missing in environment" }, { status: 500 })
    }

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })

    const options = {
      amount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    }

    const order = await instance.orders.create(options)

    if (!order || !order.id) {
      return NextResponse.json({ error: "Failed to create Razorpay order" }, { status: 500 })
    }

    // Store ALL form fields in Redis keyed by provision:{orderId}
    if (redis) {
      const payload = JSON.stringify({ name, city, state, adminEmail, adminPassword, plan })
      await redis.set(`provision:${order.id}`, payload, { ex: 1800 }) // 30 minutes TTL
    } else {
      console.warn("Redis is not available. Provision data will NOT be saved. In local dev, use an in-memory mock or configure Redis.")
      // Ideally in prod Redis is required for this architecture.
      // If redis is missing and we reach here, it will fail in verification step.
    }

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    })
  } catch (error) {
    console.error("Error creating payment order:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
