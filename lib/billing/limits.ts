import { prisma as db } from "@/lib/prisma"

export class PlanLimitExceededError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PlanLimitExceededError"
  }
}

export class FeatureNotAvailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "FeatureNotAvailableError"
  }
}

export type LimitType = "studentLimit" | "staffLimit" | "storageLimitGb"
export type FeatureType =
  | "studentPortal"
  | "parentPortal"
  | "lms"
  | "customDomain"
  | "apiAccess"
  | "whiteLabel"

/**
 * Default fallback quotas for un-onboarded schools or trial accounts without an active subscription.
 */
export const FALLBACK_FREE_PLAN_LIMITS: Record<LimitType, number> = {
  studentLimit: 50,
  staffLimit: 5,
  storageLimitGb: 1,
}

export const FALLBACK_FREE_PLAN_FEATURES: Record<FeatureType, boolean> = {
  studentPortal: true,
  parentPortal: true,
  lms: false,
  customDomain: false,
  apiAccess: false,
  whiteLabel: false,
}

/**
 * Validates if the school has capacity for a specific operational limit.
 * Will throw PlanLimitExceededError if the limit is reached.
 */
export async function enforcePlanLimit(params: {
  schoolId: string
  limitType: LimitType
  incrementBy?: number // Default: 1. How much usage is being requested.
}) {
  const { schoolId, limitType, incrementBy = 1 } = params

  const school = await db.school.findUnique({
    where: { id: schoolId },
    include: {
      subscription: {
        include: {
          plan: true,
        },
      },
      usageRecord: true,
    },
  })

  let maxLimit: number
  let planName: string
  const usage = school?.usageRecord

  if (!school?.subscription?.plan) {
    console.warn(`[BILLING] Missing subscription plan for school ${schoolId}. Enforcing FREE_TRIAL fallback limits.`)
    maxLimit = FALLBACK_FREE_PLAN_LIMITS[limitType]
    planName = "FREE_TRIAL"
  } else {
    maxLimit = school.subscription.plan[limitType]
    planName = school.subscription.plan.name
  }

  // Calculate current usage + requested increment
  let currentUsage = 0
  if (usage) {
    if (limitType === "studentLimit") currentUsage = usage.currentStudents
    if (limitType === "staffLimit") currentUsage = usage.currentStaff
    if (limitType === "storageLimitGb") currentUsage = usage.currentStorageGb
  } else if (school) {
    // Defensive fallback if usageRecord table row is not initialized yet
    if (limitType === "studentLimit") {
      currentUsage = await db.student.count({ where: { schoolId, isActive: true } })
    }
    if (limitType === "staffLimit") {
      currentUsage = await db.teacher.count({ where: { schoolId, isActive: true } })
    }
  }

  if (currentUsage + incrementBy > maxLimit) {
    throw new PlanLimitExceededError(
      `Your current plan (${planName}) allows a maximum of ${maxLimit} ${limitType.replace("Limit", "")}s. Please upgrade to continue.`
    )
  }

  return true
}

/**
 * Validates if the school has access to a specific premium feature.
 * Will throw FeatureNotAvailableError if the feature is not included in their plan.
 */
export async function enforceFeatureAccess(params: {
  schoolId: string
  feature: FeatureType
}) {
  const { schoolId, feature } = params

  const school = await db.school.findUnique({
    where: { id: schoolId },
    include: {
      subscription: {
        include: {
          plan: true,
        },
      },
    },
  })

  let hasAccess: boolean
  let planName: string

  if (!school?.subscription?.plan) {
    console.warn(`[BILLING] Missing subscription plan for school ${schoolId}. Enforcing FREE_TRIAL fallback features.`)
    hasAccess = FALLBACK_FREE_PLAN_FEATURES[feature]
    planName = "FREE_TRIAL"
  } else {
    hasAccess = school.subscription.plan[feature]
    planName = school.subscription.plan.name
  }

  if (!hasAccess) {
    throw new FeatureNotAvailableError(
      `The ${feature} feature is not available on your current plan (${planName}). Please upgrade to unlock it.`
    )
  }

  return true
}


/**
 * Helper to fetch full billing context for the UI (e.g. Dashboard banners)
 */
export async function getBillingContext(schoolId: string) {
  const school = await db.school.findUnique({
    where: { id: schoolId },
    include: {
      subscription: {
        include: {
          plan: true,
        },
      },
      usageRecord: true,
    },
  })

  if (!school?.subscription || !school?.usageRecord) {
    return null
  }

  return {
    subscription: school.subscription,
    plan: school.subscription.plan,
    usage: school.usageRecord,
  }
}
