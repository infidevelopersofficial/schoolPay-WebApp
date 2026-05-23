import { prisma } from "@/lib/prisma"

export type BillingHealthResult = {
  isHealthy: boolean;
  schoolId: string;
  issues: string[];
}

export async function checkBillingHealth(schoolId: string): Promise<BillingHealthResult> {
  const issues: string[] = [];
  
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: {
      plan: true,
      subscription: true,
    }
  });

  if (!school) {
    return { isHealthy: false, schoolId, issues: ["School not found"] };
  }

  if (!school.plan) {
    issues.push("School has no Plan assigned.");
  }

  const usage = await prisma.usageRecord.findUnique({
    where: { schoolId }
  });

  if (!usage) {
    issues.push("UsageRecord is missing.");
  } else if (school.plan) {
    if (usage.currentStudents > school.plan.studentLimit) {
      issues.push(`Usage limit exceeded: Students (${usage.currentStudents}/${school.plan.studentLimit})`);
    }
    if (usage.currentStaff > school.plan.staffLimit) {
      issues.push(`Usage limit exceeded: Staff (${usage.currentStaff}/${school.plan.staffLimit})`);
    }
  }

  if (school.subscription) {
    if (school.subscriptionStatus !== school.subscription.status) {
      issues.push(`Status mismatch: School is ${school.subscriptionStatus} but Subscription is ${school.subscription.status}`);
    }
    if (school.subscriptionStatus === "ACTIVE" && school.currentPeriodEnd) {
      if (school.currentPeriodEnd < new Date()) {
        issues.push("Subscription is ACTIVE but currentPeriodEnd is in the past.");
      }
    }
  }

  return {
    isHealthy: issues.length === 0,
    schoolId,
    issues
  };
}
