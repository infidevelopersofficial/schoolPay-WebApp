import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { sendWelcomeEmail } from "@/lib/email/sendWelcomeEmail"

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment details" }, { status: 400 })
    }

    // 1. Verify Signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keySecret) {
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 })
    }

    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex")

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 })
    }

    // 2. Fetch provisioning data from Redis
    if (!redis) {
      return NextResponse.json({ error: "Redis not configured" }, { status: 500 })
    }

    const provisionKey = `provision:${razorpay_order_id}`
    const provisionDataStr = await redis.get(provisionKey)
    if (!provisionDataStr) {
      return NextResponse.json({ error: "Provisioning data expired or not found" }, { status: 400 })
    }

    const provisionData = typeof provisionDataStr === 'string' ? JSON.parse(provisionDataStr) : provisionDataStr
    const { name, city, state, adminEmail, adminPassword, plan } = provisionData

    // 3. Provision the School
    const randomCode = Math.floor(100 + Math.random() * 900)
    const schoolCode = `SPAY-SCH-${randomCode}`
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + `-${randomCode}`
    const hashedPassword = await bcrypt.hash(adminPassword, 10)

    const school = await prisma.$transaction(async (tx) => {
      let planRecord = await tx.plan.findFirst({ where: { name: plan } })
      if (!planRecord) {
        planRecord = await tx.plan.create({
          data: {
            name: plan,
            monthlyPrice: plan === "STARTER" ? 999 : plan === "GROWTH" ? 2499 : plan === "PRO" ? 4999 : 0
          }
        })
      }

      const newSchool = await tx.school.create({
        data: {
          name,
          slug,
          schoolCode,
          tenantId: schoolCode,
          tenantType: "SCHOOL",
          city,
          state,
          planId: planRecord.id,
          razorpayOrderId: razorpay_order_id,
        }
      })

      let user = await tx.user.findUnique({ where: { email: adminEmail } })
      if (!user) {
        user = await tx.user.create({
          data: {
            name: "Admin User",
            email: adminEmail,
            hashedPassword,
            role: "ADMIN"
          }
        })
      }

      await tx.userSchool.create({
        data: {
          userId: user.id,
          schoolId: newSchool.id,
          role: "ADMIN"
        }
      })

      return newSchool
    })

    // 4. Clean up Redis
    await redis.del(provisionKey)

    // 5. Send Welcome Email
    await sendWelcomeEmail(adminEmail, school.schoolCode, school.name)

    return NextResponse.json({ success: true, schoolCode: school.schoolCode })
  } catch (error) {
    console.error("Payment verification failed:", error)
    return NextResponse.json({ error: "An error occurred during verification" }, { status: 500 })
  }
}
