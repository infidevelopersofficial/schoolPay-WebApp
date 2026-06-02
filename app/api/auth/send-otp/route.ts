// Phase 2 - MSG91 SMS API integration
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"
import nodemailer from "nodemailer"

export async function POST(req: Request) {
  try {
    const { mobile, schoolCode } = await req.json()

    if (!mobile || !schoolCode) {
      return NextResponse.json({ error: "Mobile number and school code are required" }, { status: 400 })
    }

    // 1. Find parent by mobile + schoolCode
    const parent = await prisma.parent.findFirst({
      where: {
        mobile,
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
      const rateLimitKey = `otp_rate:${schoolCode}:${mobile}`
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
    const key = `otp:${schoolCode}:${mobile}`
    if (redis) {
      await redis.set(key, otp, { ex: 300 }) // TTL 300 seconds
    } else {
      console.warn("Redis is not available, skipping OTP storage in Redis.")
    }

    // 4. Send via MSG91 API (with Graceful Fallback to Nodemailer/Console)
    const MSG91_API_KEY = process.env.MSG91_API_KEY;
    const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID;

    if (MSG91_API_KEY && MSG91_TEMPLATE_ID) {
      // MSG91 API implementation
      const options = {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authkey: MSG91_API_KEY
        },
        body: JSON.stringify({
          template_id: MSG91_TEMPLATE_ID,
          short_url: '0',
          recipients: [{ mobiles: `91${mobile}`, var1: otp }]
        })
      };

      const response = await fetch('https://control.msg91.com/api/v5/flow', options);
      if (!response.ok) {
        console.error("MSG91 API returned an error:", await response.text());
        // Fallback to console log in development even if MSG91 fails
        if (process.env.NODE_ENV === "development") {
          console.log(`[MSG91 FALLBACK] OTP for ${mobile}: ${otp}`);
        }
      }
    } else {
      // Graceful fallback if MSG91 is not configured
      console.warn("MSG91 credentials missing, falling back to Email/Console.");
      
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
        to: parent.email, // Fallback to sending to their registered email
        subject: "Your SchoolPay login OTP",
        text: `Your OTP is ${otp}. Valid for 5 minutes. Do not share.`,
      }

      if (process.env.EMAIL_SMTP_PASS) {
        await transporter.sendMail(mailOptions).catch(e => console.error("Fallback email failed", e));
      }

      // Log for dev
      if (process.env.NODE_ENV === "development") {
        console.log("DEV OTP for", mobile, ":", otp)
      }
    }

    // 6. Return response
    return NextResponse.json({ message: "OTP sent" })
  } catch (error) {
    console.error("Error sending OTP:", error)
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 })
  }
}
