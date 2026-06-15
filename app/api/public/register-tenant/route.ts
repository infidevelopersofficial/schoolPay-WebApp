import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const registerSchema = z.object({
  name: z.string().min(2),
  city: z.string().min(2),
  state: z.string().min(2),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
  tenantType: z.enum(["SCHOOL", "COACHING_CENTER", "PRIVATE_TUTOR", "TRAINING_INSTITUTE"]),
  schoolCode: z.string().min(3),
  plan: z.string().optional().default("FREE_DEMO"),
  isDemo: z.boolean().optional().default(true),
})

export async function POST(req: Request) {
  try {
    const data = await req.json()
    
    // Validate request body
    const validatedData = registerSchema.parse(data)
    const { name, city, state, adminEmail, adminPassword, tenantType, schoolCode, plan, isDemo } = validatedData

    // 1. Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    })
    
    if (existingUser) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 400 })
    }

    // 2. Check if schoolCode already exists
    const existingSchool = await prisma.school.findUnique({
      where: { schoolCode }
    })

    if (existingSchool) {
      return NextResponse.json({ error: "Institution Code is already taken" }, { status: 400 })
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + `-${randomSuffix}`
    const hashedPassword = await bcrypt.hash(adminPassword, 10)

    // Execute in a transaction. We don't need tenantContext here because we are creating the tenant itself.
    const result = await prisma.$transaction(async (tx) => {
      // Find or create the plan
      let planRecord = await tx.plan.findFirst({ where: { name: plan } })
      if (!planRecord) {
        planRecord = await tx.plan.create({
          data: {
            name: plan,
            monthlyPrice: plan === "STARTER" ? 999 : plan === "GROWTH" ? 2499 : plan === "PRO" ? 4999 : 0
          }
        })
      }

      // Create school
      const school = await tx.school.create({
        data: {
          name,
          slug,
          schoolCode,
          tenantId: schoolCode, // Important for isolating tenant data via RLS
          type: tenantType,
          tenantType: tenantType,
          city,
          state,
          planId: planRecord.id,
          isDemo,
          demoExpiresAt: isDemo ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null
        }
      })

      // Create Admin User
      const user = await tx.user.create({
        data: {
          name: "Institution Admin",
          email: adminEmail,
          hashedPassword,
          role: "ADMIN"
        }
      })

      // Link User to School
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
  } catch (error: any) {
    console.error("Failed to register tenant:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create account. Please try again." }, { status: 500 })
  }
}
