import { auth } from "@/lib/auth";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

export interface TeacherMobileSessionContext {
  userId: string;
  schoolId: string;
  teacherId: string;
  schoolRole: string;
  tenantType: string;
  planTier: string;
}

export class TeacherMobileAuthError extends Error {
  constructor(message = "Unauthorized access to teacher mobile API") {
    super(message);
    this.name = "TeacherMobileAuthError";
  }
}

/**
 * Validates the session for mobile API and returns the mobile session context.
 * Strictly enforces TEACHER role.
 */
export const getTeacherMobileSession = cache(async (): Promise<TeacherMobileSessionContext | null> => {
  const session = await auth();
  if (!session?.user) return null;

  const user = session.user as any;
  const schoolRole = user.schoolRole as string;
  const schoolId = user.activeSchoolId as string;
  const tenantType = user.tenantType as string;
  const planTier = user.planTier as string;

  if (schoolRole !== "TEACHER" || !schoolId) {
    return null;
  }

  // Look up the teacher record to ensure it exists and get the teacherId
  // The user record email is assumed to match the teacher email in that school
  const teacher = await prisma.teacher.findUnique({
    where: {
      email_schoolId: {
        email: user.email as string,
        schoolId,
      },
    },
    select: { id: true, isActive: true },
  });

  if (!teacher || !teacher.isActive) {
    return null;
  }

  return {
    userId: user.id as string,
    schoolId,
    teacherId: teacher.id,
    schoolRole,
    tenantType,
    planTier,
  };
});

/**
 * Strict wrapper that throws TeacherMobileAuthError if not authenticated as a teacher.
 */
export const requireTeacherMobileAuth = cache(async (): Promise<TeacherMobileSessionContext> => {
  const session = await getTeacherMobileSession();
  if (!session) {
    throw new TeacherMobileAuthError("Unauthorized: Teacher access required.");
  }
  return session;
});
