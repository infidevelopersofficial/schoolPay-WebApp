import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { email }
    });

    // To prevent email enumeration, we always return 200 OK whether the user exists or not.
    if (!user) {
      return NextResponse.json({ message: "If this email exists, a reset link has been sent." });
    }

    // Generate a secure token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600 * 1000); // 1 hour expiration

    // Delete any existing tokens for this user first
    await prisma.verificationToken.deleteMany({
      where: { identifier: email }
    });

    // Store in VerificationToken
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: resetToken,
        expires: expires,
      }
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password/${resetToken}`;

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.EMAIL_SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_SMTP_USER,
        pass: process.env.EMAIL_SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || "schoolpay.dev@gmail.com",
      to: email,
      subject: "Password Reset Request - SchoolPay",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a;">Password Reset Request</h2>
          <p style="color: #334155; line-height: 1.5;">You recently requested to reset your password for your SchoolPay account. Click the button below to reset it.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #64748b; font-size: 14px;">If you did not request a password reset, please ignore this email or reply to let us know. This password reset link is only valid for the next hour.</p>
          <p style="color: #64748b; font-size: 14px;">If the button doesn't work, copy and paste the following link into your browser:<br/>
          <a href="${resetUrl}" style="color: #3b82f6;">${resetUrl}</a></p>
        </div>
      `,
    };

    if (process.env.EMAIL_SMTP_PASS) {
      await transporter.sendMail(mailOptions);
    } else {
      console.warn("Email SMTP credentials missing, skipping actual email send. Reset URL:", resetUrl);
    }

    if (process.env.NODE_ENV === "development") {
      console.log("\n=============================================");
      console.log("DEV Password Reset URL for", email);
      console.log(resetUrl);
      console.log("=============================================\n");
    }

    return NextResponse.json({ message: "If this email exists, a reset link has been sent." });
  } catch (error) {
    console.error("Error sending password reset link:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
