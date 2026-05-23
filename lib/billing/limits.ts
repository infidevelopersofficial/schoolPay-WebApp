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

  if (!school?.subscription?.plan || !school?.usageRecord) {
    throw new Error("Billing context not found for school")
  }

  const { plan } = school.subscription
  const usage = school.usageRecord

  // Identify limits
  const maxLimit = plan[limitType]
  
  // Calculate current usage + requested increment
  let currentUsage = 0
  if (limitType === "studentLimit") currentUsage = usage.currentStudents
  if (limitType === "staffLimit") currentUsage = usage.currentStaff
  if (limitType === "storageLimitGb") currentUsage = usage.currentStorageGb

  if (currentUsage + incrementBy > maxLimit) {
    // Check Grace Period status? Wait, the limit is the limit.
    // If they are in GRACE_PERIOD and already exceeding, this will block them.
    // If they are ACTIVE and hit the limit, this will block them.
    throw new PlanLimitExceededError(
      `Your current plan (\${plan.name}) allows a maximum of \${maxLimit} \${limitType.replace("Limit", "")}s. Please upgrade to continue.`
    )
  }

  // If we reach here, they have capacity.
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

  if (!school?.subscription?.plan) {
    throw new Error("Billing context not found for school")
  }

  const { plan } = school.subscription

  const hasAccess = plan[feature]

  if (!hasAccess) {
    throw new FeatureNotAvailableError(
      `The \${feature} feature is not available on your current plan (\${plan.name}). Please upgrade to unlock it.`
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
