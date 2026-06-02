"use server"

import { withTenantAuth } from "@/lib/tenant-auth"
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSchoolId } from "@/lib/tenant-context";
import { redirect } from "next/navigation";

export async function completeOnboarding(formData: FormData) {
  let success = false;
  try {
    await withTenantAuth(null, ["ADMIN"], async () => {
      const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const schoolId = await getSchoolId();
  if (!schoolId) throw new Error("No school selected");

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
    })
    success = true;
  } catch (e: any) {
    return { error: e.message || "Unauthorized" }
  }

  if (success) {
    redirect("/dashboard");
  }
}