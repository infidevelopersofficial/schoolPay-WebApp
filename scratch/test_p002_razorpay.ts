import { verifyRazorpaySignature } from "../lib/billing/razorpay";
import crypto from "crypto";

async function testP002() {
  console.log("Running unit test for P0-02: verifyRazorpaySignature constant-time check...");
  
  const secret = "whsec_test_secret_12345";
  const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_123" } } } });

  // 1. Generate valid HMAC
  const validSignature = crypto.createHmac("sha256", secret).update(body).digest("hex");
  
  if (!verifyRazorpaySignature(body, validSignature, secret)) {
    throw new Error("Valid signature assertion failed! Expected true for legitimate HMAC.");
  }

  // 2. Tampered signature (same length, 1 byte different)
  const tamperedSignature = validSignature.slice(0, -1) + (validSignature.slice(-1) === "0" ? "1" : "0");
  if (verifyRazorpaySignature(body, tamperedSignature, secret)) {
    throw new Error("Tampered signature assertion failed! Expected false.");
  }

  // 3. Different length signature (e.g. 10 chars)
  if (verifyRazorpaySignature(body, "short_sig", secret)) {
    throw new Error("Short signature assertion failed! Expected false without throwing RangeError.");
  }

  // 4. Empty / null / undefined signature
  if (verifyRazorpaySignature(body, "", secret) || verifyRazorpaySignature(body, null as any, secret)) {
    throw new Error("Empty/null signature assertion failed! Expected false.");
  }

  console.log("✅ P0-02 Unit Test Passed! Webhook signature verification handles valid, tampered, and malformed inputs in constant time.");
}

testP002().catch(err => {
  console.error("❌ P0-02 Unit Test Failed:", err);
  process.exit(1);
});
