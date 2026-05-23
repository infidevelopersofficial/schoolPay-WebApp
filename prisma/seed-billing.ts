/**
 * Billing Seeder & Migration Script
 *
 * This script seeds the initial billing Plans (FREE, STARTER, GROWTH, ENTERPRISE)
 * and assigns all existing schools to the FREE plan. If any school exceeds FREE
 * limits, it is flagged as GRACE_PERIOD.
 *
 * Run manually: npx tsx prisma/seed-billing.ts
 */

import "dotenv/config"
import { PrismaClient, SubscriptionStatus } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set.")
  process.exit(1)
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const PLANS = [
  {
    name: "FREE",
    description: "For small schools getting started.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    studentLimit: 50,
    staffLimit: 5,
    storageLimitGb: 1,
    studentPortal: false,
    parentPortal: false,
    lms: false,
    customDomain: false,
    apiAccess: false,
    whiteLabel: false,
  },
  {
    name: "STARTER",
    description: "Core features for growing schools.",
    monthlyPrice: 199900, // ₹1,999 in paise
    yearlyPrice: 1999900, // ₹19,999 in paise
    studentLimit: 500,
    staffLimit: 25,
    storageLimitGb: 10,
    studentPortal: true,
    parentPortal: false,
    lms: false,
    customDomain: false,
    apiAccess: false,
    whiteLabel: false,
  },
  {
    name: "GROWTH",
    description: "Advanced tools for large institutions.",
    monthlyPrice: 499900, // ₹4,999 in paise
    yearlyPrice: 4999900, // ₹49,999 in paise
    studentLimit: 2000,
    staffLimit: 100,
    storageLimitGb: 100,
    studentPortal: true,
    parentPortal: true,
    lms: true,
    customDomain: true,
    apiAccess: false,
    whiteLabel: false,
  },
  {
    name: "ENTERPRISE",
    description: "Unlimited potential and API access.",
    monthlyPrice: 999900, // custom placeholder
    yearlyPrice: 9999900,
    studentLimit: 10000,
    staffLimit: 500,
    storageLimitGb: 1000,
    studentPortal: true,
    parentPortal: true,
    lms: true,
    customDomain: true,
    apiAccess: true,
    whiteLabel: true,
  },
]

async function main() {
  console.log("🚀 Seeding billing plans & migrating schools...")

  // Bypass RLS just in case since we are updating globally
  await prisma.$executeRawUnsafe("SELECT set_config('app.current_tenant', '', FALSE)")

  // 1. Seed Plans
  const plans: Record<string, any> = {}
  for (const planData of PLANS) {
    const p = await prisma.plan.upsert({
      where: { name: planData.name },
      update: planData,
      create: planData,
    })
    plans[p.name] = p
  }
  console.log("✅ Plans seeded successfully.")

  // 2. Migrate Schools
  const schools = await prisma.school.findMany({
    include: {
      students: { select: { id: true } },
      teachers: { select: { id: true } },
    },
  })

  const freePlan = plans["FREE"]

  for (const school of schools) {
    // Determine active counts (in reality we should check isActive=true, but count total for now)
    const studentCount = school.students.length
    const staffCount = school.teachers.length

    // Does school exceed FREE limits?
    const exceedsLimits =
      studentCount > freePlan.studentLimit || staffCount > freePlan.staffLimit

    let subStatus: SubscriptionStatus = "ACTIVE"
    let graceEndsAt = null

    if (exceedsLimits) {
      subStatus = "GRACE_PERIOD"
      const d = new Date()
      d.setDate(d.getDate() + 14) // +14 days
      graceEndsAt = d
    }

    const now = new Date()
    const currentPeriodEnd = new Date()
    currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 10) // Legacy lifetime mapped to 10 years free

    // Create Subscription
    const subscription = await prisma.subscription.upsert({
      where: { schoolId: school.id },
      update: {
        planId: freePlan.id,
        status: subStatus,
        currentPeriodEnd,
        graceEndsAt,
      },
      create: {
        schoolId: school.id,
        planId: freePlan.id,
        status: subStatus,
        billingCycle: "NONE",
        currentPeriodStart: now,
        currentPeriodEnd,
        graceEndsAt,
      },
    })

    // Create UsageRecord
    await prisma.usageRecord.upsert({
      where: { schoolId: school.id },
      update: {
        currentStudents: studentCount,
        currentStaff: staffCount,
        lastCalculatedAt: now,
      },
      create: {
        schoolId: school.id,
        currentStudents: studentCount,
        currentStaff: staffCount,
        lastCalculatedAt: now,
      },
    })

    // Update School with back-references
    await prisma.school.update({
      where: { id: school.id },
      data: {
        planId: freePlan.id,
        subscriptionStatus: subStatus,
        currentPeriodEnd,
      },
    })

    if (exceedsLimits) {
      await prisma.billingEvent.create({
        data: {
          subscriptionId: subscription.id,
          schoolId: school.id,
          action: "LIMIT_EXCEEDED",
          description: "Legacy school exceeded FREE plan limits during migration. Granted 14 days GRACE_PERIOD.",
        },
      })
      console.log(`⚠️  School ${school.slug} exceeded limits (${studentCount} students). Placed in GRACE_PERIOD.`)
    } else {
      console.log(`✅  School ${school.slug} mapped to FREE plan successfully.`)
    }
  }

  console.log("🎉 Migration complete!")
}

main()
  .catch((e) => {
    console.error("❌ Migration failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
