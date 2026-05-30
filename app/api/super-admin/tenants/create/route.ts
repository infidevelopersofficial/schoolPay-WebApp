import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (session?.user?.role !== "SCHOOLPAY_TEAM") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const data = await req.json()
    const { name, city, state, adminEmail, adminPassword, plan, isDemo } = data

    if (!name || !adminEmail || !adminPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate random school code
    const randomCode = Math.floor(100 + Math.random() * 900)
    const schoolCode = `SPAY-SCH-${randomCode}`
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + `-${randomCode}`
    const hashedPassword = await bcrypt.hash(adminPassword, 10)

    const result = await prisma.$transaction(async (tx) => {
      // 1. Find or create plan (mocking standard plan assignment)
      let planRecord = await tx.plan.findFirst({ where: { name: plan } })
      if (!planRecord) {
        planRecord = await tx.plan.create({
          data: {
            name: plan,
            monthlyPrice: plan === "STARTER" ? 999 : plan === "GROWTH" ? 2499 : plan === "PRO" ? 4999 : 0
          }
        })
      }

      // 2. Create school
      const school = await tx.school.create({
        data: {
          name,
          slug,
          schoolCode,
          tenantId: schoolCode,
          tenantType: "SCHOOL",
          city,
          state,
          planId: planRecord.id,
          isDemo,
          demoExpiresAt: isDemo ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null
        }
      })

      // 3. Create Admin User
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

      // 4. Link User to School
      await tx.userSchool.create({
        data: {
          userId: user.id,
          schoolId: school.id,
          role: "ADMIN"
        }
      })

      return school
    })

    return NextResponse.json({ success: true, school: result })
  } catch (error) {
    console.error("Failed to create school:", error)
    return NextResponse.json({ error: "Failed to create school. Email or Code might already exist." }, { status: 500 })
  }
}
