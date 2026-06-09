"use server"

import { withTenantAuth } from "@/lib/tenant-auth"
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSchoolId, getTenantContext } from "@/lib/tenant-context";
import { onboardingSchema } from "@/lib/validations/onboarding-schema";
import { onboardingRateLimit } from "@/lib/ratelimit";
import { headers } from "next/headers";

export type ActionResult = {
  success: boolean;
  message?: string;
  redirectTo?: string;
  error?: string;
};

export async function completeWizardOnboarding(formData: FormData): Promise<ActionResult> {
  try {
    let alreadyCompleted = false;
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const { schoolId, schoolRole } = await getTenantContext();
    if (!schoolId) throw new Error("No school selected");
    if (schoolRole !== "ADMIN" && session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized role");

      // Rate limiting
      const headersList = await headers();
      const ip = headersList.get("x-forwarded-for") || "127.0.0.1";
      const { success: rateLimitSuccess } = await onboardingRateLimit.limit(ip);
      if (!rateLimitSuccess) {
        throw new Error("Too many onboarding attempts. Please try again later.");
      }

      // Idempotency check
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: { type: true, onboardingStatus: true }
      });

      if (!school) throw new Error("School not found");
      
      if (school.onboardingStatus === "COMPLETED") {
        alreadyCompleted = true;
        return;
      }

      const validationResult = onboardingSchema.safeParse(Object.fromEntries(formData));
      if (!validationResult.success) {
        console.error("ONBOARDING VALIDATION FAILED:", validationResult.error.errors);
        throw new Error(validationResult.error.errors[0].message);
      }
      
      const parsedData = validationResult.data;

      await prisma.$transaction(async (tx) => {
        // 1. Update School with SaaS fields
        await tx.school.update({
        where: { id: schoolId },
        data: {
          slug: parsedData.slug,
          state: parsedData.state,
          city: parsedData.city,
          timezone: parsedData.timezone,
          currency: parsedData.currency,
          settings: { region: parsedData.region, language: parsedData.language },
          onboardingStatus: "COMPLETED",
          onboardingCompletedAt: new Date()
        }
      });

      await tx.auditLog.create({
        data: {
          action: "ONBOARDING_COMPLETED",
          entityType: "School",
          entityId: schoolId,
          schoolId: schoolId,
          userId: session.user.id,
          description: "Tenant onboarding completed via wizard"
        }
      });

      // 2. Create Defaults based on SECURE tenantType from Database
      const tenantType = school.type;
      const currentYear = new Date().getFullYear();
        
        if (tenantType === "SCHOOL") {
          const academicYear = parsedData.academicYear || `${currentYear}-${currentYear + 1}`;
          const sessionData = await tx.academicSession.create({
            data: {
              name: academicYear,
              startDate: new Date(`${currentYear}-04-01`),
              endDate: new Date(`${currentYear + 1}-03-31`),
              isCurrent: true,
              schoolId
            }
          });

          const classesCount = parseInt(parsedData.classesCount || "10");
          const classData = [];
          for (let i = 1; i <= Math.min(classesCount, 12); i++) {
            classData.push({ name: `Class ${i}`, section: "A", capacity: 40, schoolId });
          }
          if (classData.length > 0) {
            await tx.class.createMany({ data: classData });
          }

          await tx.fee.create({
            data: {
              type: "Tuition Fee",
              amount: 2000,
              description: "Monthly Tuition Fee",
              frequency: "MONTHLY",
              sessionId: sessionData.id,
              schoolId
            }
          });

        } else if (tenantType === "COACHING_CENTER") {
          const coursesCount = parseInt(parsedData.coursesCount || "2");
          const batchesCount = parseInt(parsedData.batchesCount || "2");
          
          const batchData: any[] = [];
          for (let c = 1; c <= coursesCount; c++) {
            for (let b = 1; b <= batchesCount; b++) {
              batchData.push({
                name: `Course ${c} Batch ${b}`,
                subjectFocus: `Course ${c}`,
                capacity: 50,
                schoolId
              });
            }
          }
          if (batchData.length > 0) {
            await tx.batch.createMany({ data: batchData });
          }

        } else if (tenantType === "PRIVATE_TUTOR") {
          const subjectsCount = parseInt(parsedData.subjectsCount || "3");
          const subjectData = [];
          for (let s = 1; s <= subjectsCount; s++) {
            subjectData.push({
              name: `Subject ${s}`,
              code: `SUB${s}`,
              schoolId
            });
          }
          if (subjectData.length > 0) {
            await tx.subject.createMany({ data: subjectData });
          }
        }
        
        await tx.auditLog.create({
          data: {
            action: "DEFAULT_DATA_CREATED",
            entityType: "School",
            entityId: schoolId,
            schoolId: schoolId,
            userId: session.user.id,
            description: `Generated default settings for ${tenantType}`
          }
        });
      }, {
        maxWait: 10000, // 10 seconds to acquire connection
        timeout: 30000  // 30 seconds to execute transaction
      });

    if (alreadyCompleted) {
      return { success: true, redirectTo: "/dashboard" };
    }

    return { success: true, redirectTo: "/dashboard" };
  } catch (e: any) {
    console.error("ONBOARDING ACTION ERROR:", e);
    return { success: false, error: e.message || "Failed to complete onboarding" };
  }
}

export async function completeOnboarding(formData: FormData): Promise<ActionResult> {
  let success = false;
  try {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const { schoolId, schoolRole } = await getTenantContext();
    if (!schoolId) throw new Error("No school selected");
    if (schoolRole !== "ADMIN" && session.user.role !== "SUPER_ADMIN") throw new Error("Unauthorized role");

  // Fetch school to know tenant type
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { type: true }
  });

  if (!school) throw new Error("School not found");

  await prisma.$transaction(async (tx) => {
    // Common: Create an Academic Session
    const currentYear = new Date().getFullYear();
    const academicYear = formData.get("academicYear") as string || `${currentYear}-${currentYear + 1}`;
    
    await tx.academicSession.create({
      data: {
        name: academicYear,
        startDate: new Date(`${currentYear}-04-01`),
        endDate: new Date(`${currentYear + 1}-03-31`),
        isCurrent: true,
        schoolId
      }
    });

    if (school.type === "SCHOOL") {
      const totalClassesStr = formData.get("totalClasses") as string;
      const totalClasses = parseInt(totalClassesStr) || 10;
      
      // Create some default classes
      const classData = [];
      for (let i = 1; i <= Math.min(totalClasses, 12); i++) {
        classData.push({
          name: `Class ${i}`,
          section: "A",
          capacity: 40,
          schoolId
        });
      }
      if (classData.length > 0) {
        await tx.class.createMany({ data: classData });
      }

      // Default fee
      await tx.fee.create({
        data: {
          type: "Tuition Fee",
          amount: 2000,
          description: "Monthly Tuition Fee",
          frequency: "MONTHLY",
          schoolId
        }
      });

    } else if (school.type === "COACHING_CENTER") {
      const coursesStr = formData.get("courses") as string || "JEE, NEET";
      const batchesStr = formData.get("batches") as string;
      const totalBatches = parseInt(batchesStr) || 2;
      
      const courses = coursesStr.split(",").map(s => s.trim()).filter(Boolean);
      
      const batchData: any[] = [];
      courses.forEach(course => {
        for (let i = 1; i <= totalBatches; i++) {
          batchData.push({
            name: `${course} Batch ${i}`,
            subjectFocus: course,
            capacity: 50,
            schoolId
          });
        }
      });
      
      if (batchData.length > 0) {
        await tx.batch.createMany({ data: batchData });
      }

    } else if (school.type === "PRIVATE_TUTOR") {
      const subjectsStr = formData.get("subjects") as string || "Math, Science";
      const subjects = subjectsStr.split(",").map(s => s.trim()).filter(Boolean);
      
      const subjectData = subjects.map(sub => ({
        name: sub,
        code: sub.substring(0, 3).toUpperCase(),
        schoolId
      }));
      
      if (subjectData.length > 0) {
        await tx.subject.createMany({ data: subjectData });
      }
    }

    // Mark the school as completed in the database
    await tx.school.update({
      where: { id: schoolId },
      data: { 
        onboardingStatus: "COMPLETED",
        onboardingCompletedAt: new Date()
      }
    });
  });
    success = true;
  } catch (e: any) {
    return { success: false, error: e.message || "Unauthorized" }
  }

  if (success) {
    return { success: true, redirectTo: "/dashboard" };
  }
  
  return { success: false, error: "Failed to complete onboarding" };
}