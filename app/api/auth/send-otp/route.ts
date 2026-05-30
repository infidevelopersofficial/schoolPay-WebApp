// TODO [FUTURE - SMS]: Replace Nodemailer block with MSG91 SMS API.
// Switch input field from email to mobile number.
// Redis key pattern stays the same: otp:{schoolCode}:{mobile}
// Required env vars: MSG91_API_KEY, MSG91_SENDER_ID, MSG91_TEMPLATE_ID

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"
import nodemailer from "nodemailer"

export async function POST(req: Request) {
  try {
    const { email, schoolCode } = await req.json()

    if (!email || !schoolCode) {
      return NextResponse.json({ error: "Email and school code are required" }, { status: 400 })
    }

    // 1. Find parent by email + schoolCode
    const parent = await prisma.parent.findFirst({
      where: {
        email,
        school: {
          OR: [
            { schoolCode },
            { tenantId: schoolCode },
            { slug: schoolCode }
          ]
        }
      }
    })

    if (!parent) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 })
    }

    // 1.5 Rate Limiting
    if (redis) {
      const rateLimitKey = `otp_rate:${schoolCode}:${email}`
      const attempts = await redis.incr(rateLimitKey)
      if (attempts === 1) await redis.expire(rateLimitKey, 900)
      if (attempts > 3) return NextResponse.json(
        { error: "Too many OTP requests. Try again in 15 minutes." },
        { status: 429 }
      )
    }

    // 2. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // 3. Store in Upstash Redis
    const key = `otp:${schoolCode}:${email}`
    if (redis) {
      await redis.set(key, otp, { ex: 300 }) // TTL 300 seconds
    } else {
      console.warn("Redis is not available, skipping OTP storage in Redis.")
    }

    // 4. Send via Nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.EMAIL_SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_SMTP_USER,
        pass: process.env.EMAIL_SMTP_PASS,
      },
    })

    const mailOptions = {
      from: process.env.EMAIL_FROM || "schoolpay.dev@gmail.com",
      to: email,
      subject: "Your SchoolPay login OTP",
      text: `Your OTP is ${otp}. Valid for 5 minutes. Do not share.`,
    }

    if (process.env.EMAIL_SMTP_PASS) {
      await transporter.sendMail(mailOptions)
    } else {
      console.warn("Email SMTP credentials missing, skipping actual email send.")
    }

    // 5. Log for dev
    if (process.env.NODE_ENV === "development") {
      console.log("DEV OTP for", email, ":", otp)
    }

    // 6. Return response
    return NextResponse.json({ message: "OTP sent" })
  } catch (error) {
    console.error("Error sending OTP:", error)
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 })
  }
}
