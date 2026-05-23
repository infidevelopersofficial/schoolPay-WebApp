import { prisma } from "@/lib/prisma"

export async function getPlatformMetrics() {
  const activeSchools = await prisma.school.count({
    where: { isActive: true },
  })

  // MRR is sum of monthly price of all active subscriptions
  const activeSubscriptions = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
    },
    include: {
      plan: true,
    },
  })

  let totalMrr = 0
  let totalArr = 0

  for (const sub of activeSubscriptions) {
    if (sub.billingCycle === "MONTHLY") {
      totalMrr += sub.plan.monthlyPrice
      totalArr += sub.plan.monthlyPrice * 12
    } else if (sub.billingCycle === "YEARLY") {
      totalMrr += sub.plan.yearlyPrice / 12
      totalArr += sub.plan.yearlyPrice
    }
  }

  // Active students across all active schools
  const activeStudents = await prisma.student.count({
    where: {
      accountStatus: { in: ["ACTIVE", "PENDING_ACTIVATION"] },
      school: { isActive: true },
    },
  })

  // Staff across all active schools
  const activeStaff = await prisma.teacher.count({
    where: {
      isActive: true,
      school: { isActive: true },
    },
  })

  return {
    activeSchools,
    activeStudents,
    activeStaff,
    mrr: Math.round(totalMrr), // in paise
    arr: Math.round(totalArr), // in paise
  }
}
