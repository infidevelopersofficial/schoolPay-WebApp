import Razorpay from "razorpay"

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn("⚠️ RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing. Razorpay features will not work.")
}

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "dummy_key_id",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "dummy_key_secret",
})

/**
 * Validates the Razorpay webhook signature.
 * Returns true if valid, false otherwise.
 */
export function verifyRazorpaySignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require("crypto")
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body.toString())
    .digest("hex")

  return expectedSignature === signature
}
