import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // 1. In a multi-tenant app with varying roles (ADMIN, TEACHER, PARENT, STUDENT, TEAM),
    // we would check the User table. Here we use findFirst for generic users.
    const user = await prisma.user.findFirst({
      where: { email }
    });

    // To prevent email enumeration, we always return 200 OK whether the user exists or not.
    if (!user) {
      return NextResponse.json({ message: "If this email exists, a reset link has been sent." });
    }

    // 2. Generate a secure token (mocked for now, normally use crypto.randomBytes)
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

    // Note: You would normally store this token in a PasswordResetToken table or Redis
    // await prisma.passwordResetToken.create({ ... })

    // 3. Send via Nodemailer
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
        <p>You requested a password reset for your SchoolPay account.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>If you did not request this, please ignore this email.</p>
      `,
    };

    if (process.env.EMAIL_SMTP_PASS) {
      await transporter.sendMail(mailOptions);
    } else {
      console.warn("Email SMTP credentials missing, skipping actual email send. Reset URL:", resetUrl);
    }

    if (process.env.NODE_ENV === "development") {
      console.log("DEV Password Reset URL for", email, ":", resetUrl);
    }

    return NextResponse.json({ message: "If this email exists, a reset link has been sent." });
  } catch (error) {
    console.error("Error sending password reset link:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
