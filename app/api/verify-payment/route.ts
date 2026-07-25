import { NextResponse } from "next/server"
import crypto from "crypto"

/**
 * STEP 3: BACKEND - Verify Signature
 * Endpoint: POST /api/verify-payment
 * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
 * Compare generated signature with razorpay_signature using timingSafeEqual
 * Return success only if signatures match
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required verification fields (razorpay_order_id, razorpay_payment_id, razorpay_signature)" },
        { status: 400 }
      )
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keySecret) {
      return NextResponse.json(
        { error: "Razorpay secret key not configured on server" },
        { status: 500 }
      )
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(payload)
      .digest("hex")

    const expectedBuffer = Buffer.from(generatedSignature, "utf8")
    const actualBuffer = Buffer.from(razorpay_signature, "utf8")

    if (
      expectedBuffer.length !== actualBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, actualBuffer)
    ) {
      return NextResponse.json(
        { error: "Payment signature verification failed. HMAC mismatch detected." },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Payment signature verified successfully",
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    })
  } catch (error: any) {
    console.error("Razorpay verify-payment endpoint error:", error)
    return NextResponse.json(
      { error: "An internal server error occurred during signature verification" },
      { status: 500 }
    )
  }
}
