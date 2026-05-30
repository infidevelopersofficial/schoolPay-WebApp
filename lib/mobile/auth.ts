import { auth } from "@/lib/auth";
import { cache } from "react";

export interface MobileSessionContext {
  userId: string;
  schoolId: string;
  parentId: string;
  schoolRole: string;
  tenantType: string;
  planTier: string;
}

export class MobileAuthError extends Error {
  constructor(message = "Unauthorized access to mobile API") {
    super(message);
    this.name = "MobileAuthError";
  }
}

/**
 * Validates the session for mobile API and returns the mobile session context.
 * For Phase 7A, mobile API is strictly for PARENT role.
 */
export const getMobileSession = cache(async (): Promise<MobileSessionContext | null> => {
  const session = await auth();
  if (!session?.user) return null;

  const user = session.user as any;
  const schoolRole = user.schoolRole as string;
  const schoolId = user.activeSchoolId as string;
  const tenantType = user.tenantType as string;
  const planTier = user.planTier as string;
  const parentId = user.parentId as string | null;

  if (schoolRole !== "PARENT" || !schoolId || !parentId) {
    return null;
  }

  return {
    userId: user.id as string,
    schoolId,
    parentId,
    schoolRole,
    tenantType,
    planTier,
  };
});

/**
 * Strict wrapper that throws MobileAuthError if not authenticated as a parent.
 */
export const requireMobileAuth = cache(async (): Promise<MobileSessionContext> => {
  const session = await getMobileSession();
  if (!session) {
    throw new MobileAuthError("Unauthorized: Parent access required.");
  }
  return session;
});
