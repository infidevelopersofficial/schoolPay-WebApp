import { SubscriptionStatus } from "@prisma/client"

export const ALLOWED_TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  ACTIVE: ["PAST_DUE", "CANCELED", "GRACE_PERIOD"],
  PAST_DUE: ["ACTIVE", "CANCELED", "EXPIRED"],
  CANCELED: [], 
  TRIALING: ["ACTIVE", "CANCELED", "PAST_DUE"],
  EXPIRED: ["ACTIVE", "CANCELED"],
  GRACE_PERIOD: ["ACTIVE", "CANCELED", "PAST_DUE"]
}

export function isValidTransition(current: SubscriptionStatus, next: SubscriptionStatus): boolean {
  return ALLOWED_TRANSITIONS[current].includes(next)
}

/**
 * Executes an atomic subscription state transition and logs a BillingEvent.
 * Enforces valid transition paths defined in ALLOWED_TRANSITIONS.
 */
export async function transitionSubscription(
  db: any,
  subId: string,
  schoolId: string,
  current: SubscriptionStatus,
  next: SubscriptionStatus,
  context: { action: string; description?: string }
) {
  if (!isValidTransition(current, next)) {
    throw new Error(`Invalid subscription transition from ${current} to ${next}`)
  }
  
  await db.subscription.update({
    where: { id: subId },
    data: { status: next },
  })

  await db.billingEvent.create({
    data: {
      subscriptionId: subId,
      schoolId: schoolId,
      action: context.action,
      description: context.description || `Transitioned from ${current} to ${next}`,
    },
  })
}

