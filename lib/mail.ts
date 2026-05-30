import fs from "fs"
import path from "path"

interface SendMailOptions {
  to: string
  subject: string
  html: string
}

/**
 * Modular Mail Service
 * Uses APP_URL for prefixing, logs to console and scratch/emails.log in development,
 * and can easily be wired to Resend or Nodemailer in production.
 */
export async function sendMail({ to, subject, html }: SendMailOptions) {
  const appUrl = process.env.APP_URL || "http://localhost:3000"

  // Ensure absolute URLs are used in HTML template links
  const processedHtml = html.replace(/href="\/([^"]+)"/g, `href="${appUrl}/$1"`)

  if (process.env.NODE_ENV === "development") {
    console.log(`\n📧 [EMAIL DISPATCHED]`)
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log(`----------------------------------------`)
  }
  
  // Extract and print any links in the email body for easy terminal clicking during testing
  const linkRegex = /href="([^"]+)"/g
  let match
  const links: string[] = []
  while ((match = linkRegex.exec(processedHtml)) !== null) {
    links.push(match[1])
  }
  if (links.length > 0 && process.env.NODE_ENV === "development") {
    console.log(`Links found:`)
    links.forEach(link => console.log(`👉 ${link}`))
    console.log(`----------------------------------------\n`)
  }

  // Log to scratch/emails.log for verification audit
  const logDir = path.join(process.cwd(), ".system_generated", "scratch")
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }

  const logPath = path.join(logDir, "emails.log")
  const logEntry = {
    timestamp: new Date().toISOString(),
    to,
    subject,
    links,
    html: processedHtml,
  }

  fs.appendFileSync(logPath, JSON.stringify(logEntry) + "\n", "utf8")

  // Production dispatch: wire Resend API or SMTP transport here
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "SchoolPay <noreply@schoolpay.example.com>",
          to,
          subject,
          html: processedHtml,
        }),
      })
      if (!res.ok) {
        console.error("Resend API failed to dispatch mail:", await res.text())
      }
    } catch (err) {
      console.error("Failed to connect to Resend API:", err)
    }
  }

  return { success: true }
}
