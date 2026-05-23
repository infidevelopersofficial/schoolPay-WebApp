"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateTenantId } from "@/lib/utils/tenant-id-generator";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { withSystemContext } from "@/lib/tenant-auth";

export async function registerTenant(formData: FormData) {
  try {
    const type = formData.get("type") as "SCHOOL" | "COACHING_CENTER" | "PRIVATE_TUTOR";
    const name = formData.get("name") as string;
    const adminName = formData.get("adminName") as string;
    const adminEmail = formData.get("adminEmail") as string;
    const adminPhone = formData.get("adminPhone") as string;
    const password = formData.get("password") as string;
    const city = formData.get("city") as string;
    const state = formData.get("state") as string;
    const gstin = formData.get("gstin") as string | null;
    const website = formData.get("website") as string | null;
    const address = formData.get("address") as string | null;

    if (!type || !name || !adminName || !adminEmail || !adminPhone || !password || !city || !state) {
      return { error: "Missing required fields." };
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: adminEmail },
          { phone: adminPhone }
        ]
      }
    });

    if (existingUser) {
      return { error: "A user with this email or mobile number already exists." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const tenantId = await generateTenantId(type);
    
    // Generate a simple slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString().slice(-4);

    // Create everything in a transaction using withSystemContext to bypass RLS safely
    await withSystemContext(async () => {
      await prisma.$transaction(async (tx) => {
        // 1. Create School
        const school = await tx.school.create({
          data: {
            name,
            slug,
            tenantId,
            type,
            city,
            state,
            gstin,
            website,
            address,
            email: adminEmail,
            phone: adminPhone,
            onboardingStatus: "IN_PROGRESS",
            onboardingStartedAt: new Date()
          }
        });

        // 2. Create User
        const user = await tx.user.create({
          data: {
            name: adminName,
            email: adminEmail,
            phone: adminPhone,
            hashedPassword,
            role: "ADMIN" // The default User role, but they will be SUPER_ADMIN in UserSchool
          }
        });

        // 3. Link User to School as SUPER_ADMIN
        await tx.userSchool.create({
          data: {
            userId: user.id,
            schoolId: school.id,
            role: "SUPER_ADMIN"
          }
        });
      });
    });

    // We can't automatically log in via Auth.js in a server action that isn't connected to the signIn route directly in some cases,
    // but NextAuth v5 allows calling signIn directly from Server Actions!
    try {
      await signIn("credentials", {
        email: adminEmail,
        password: password,
        redirect: true,
        redirectTo: "/onboarding"
      });
    } catch (err) {
      if (err instanceof AuthError) {
        return { error: "Account created, but failed to log in automatically. Please log in manually." };
      }
      throw err; // NEXT_REDIRECT is thrown by signIn on success
    }

  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") {
      throw error; // Let Next.js handle the redirect
    }
    console.error("Registration Error:", error);
    return { error: "Failed to create account. Please try again later." };
  }
}
