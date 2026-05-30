import nodemailer from "nodemailer"

export async function sendWelcomeEmail(adminEmail: string, schoolCode: string, schoolName: string) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.EMAIL_SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_SMTP_USER,
        pass: process.env.EMAIL_SMTP_PASS,
      },
    })

    const loginUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login`

    const mailOptions = {
      from: process.env.EMAIL_FROM || "schoolpay.dev@gmail.com",
      to: adminEmail,
      subject: "Welcome to SchoolPay — Your school is ready",
      text: `Your school ${schoolName} has been set up on SchoolPay.
School Code: ${schoolCode}
Login at: ${loginUrl}
Use the Admin tab and enter your school code to get started.`,
    }

    const info = await transporter.sendMail(mailOptions)
    if (process.env.NODE_ENV === "development") console.log("Welcome email sent: %s", info.messageId)
    return { success: true }
  } catch (error) {
    console.error("Error sending welcome email:", error)
    return { success: false, error }
  }
}
