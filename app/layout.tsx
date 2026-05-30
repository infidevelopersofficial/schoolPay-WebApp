import type React from "react"
import type { Metadata, Viewport } from "next"
// import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { Toaster } from "sonner"
import "./globals.css"

// Use a static fallback className instead of remote font fetches to support offline sandboxed builds
const inter = { className: "font-sans" }


export const metadata: Metadata = {
  metadataBase: new URL("https://schoolpay.example.com"),
  title: "SchoolPay - School Fees Management System",
  description:
    "A comprehensive school fees management system for managing students, teachers, parents, fees, payments, attendance, and more.",
  keywords: ["school", "fees", "management", "students", "payments", "attendance"],
  authors: [{ name: "SchoolPay" }],
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#8B5CF6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${inter.className} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster position="top-right" richColors />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
