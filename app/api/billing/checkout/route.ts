import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma as db } from "@/lib/prisma"
import { razorpay } from "@/lib/billing/razorpay"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.activeSchoolId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify school admin
    const userSchool = await db.userSchool.findUnique({
      where: {
        userId_schoolId: {
          userId: session.user.id,
          schoolId: session.user.activeSchoolId,
        },
      },
    })

    if (!userSchool || userSchool.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { planId, billingCycle } = body // billingCycle: 'MONTHLY' | 'YEARLY'

    if (!planId || !billingCycle) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const plan = await db.plan.findUnique({ where: { id: planId } })
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    if (plan.name === "FREE") {
      return NextResponse.json({ error: "Cannot checkout free plan directly" }, { status: 400 })
    }

    // 1. Get/Map Razorpay Plan ID
    // In production, you would map internal plan IDs to Razorpay Plan IDs.
    // For this implementation, we use ENV variables or a simple map.
    const rzpPlanMap: Record<string, Record<string, string | undefined>> = {
      STARTER: {
        MONTHLY: process.env.RZP_PLAN_STARTER_MONTHLY,
        YEARLY: process.env.RZP_PLAN_STARTER_YEARLY,
      },
      GROWTH: {
        MONTHLY: process.env.RZP_PLAN_GROWTH_MONTHLY,
        YEARLY: process.env.RZP_PLAN_GROWTH_YEARLY,
      },
      ENTERPRISE: {
        MONTHLY: process.env.RZP_PLAN_ENTERPRISE_MONTHLY,
        YEARLY: process.env.RZP_PLAN_ENTERPRISE_YEARLY,
      },
    }

    const rzpPlanId = rzpPlanMap[plan.name]?.[billingCycle]

    if (!rzpPlanId) {
      return NextResponse.json(
        { error: "Billing configuration error. Razorpay Plan ID missing for this tier/cycle." },
        { status: 500 }
      )
    }

    // 2. Create Subscription in Razorpay
    const rzpSubscription = await razorpay.subscriptions.create({
      plan_id: rzpPlanId,
      customer_notify: 1,
      total_count: billingCycle === "MONTHLY" ? 120 : 10, // 10 years by default
      notes: {
        schoolId: session.user.activeSchoolId,
        planId: plan.id,
        billingCycle,
      },
    })

    return NextResponse.json({
      subscriptionId: rzpSubscription.id,
      keyId: process.env.RAZORPAY_KEY_ID,
    })
  } catch (error: any) {
    console.error("Checkout Error:", error)
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    )
  }
}
