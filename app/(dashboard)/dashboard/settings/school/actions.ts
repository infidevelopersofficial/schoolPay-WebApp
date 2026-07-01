"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { withTenantAuth } from "@/lib/tenant-auth";

export async function updateSchoolProfile(formData: FormData) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async (config, schoolId) => {
      const name = formData.get("name") as string;
      const address = formData.get("address") as string;
      const phone = formData.get("phone") as string;
      const email = formData.get("email") as string;
      const gstin = formData.get("gstin") as string;
      const logoUrl = formData.get("logoUrl") as string;

      await prisma.school.update({
        where: { id: schoolId },
        data: {
          name,
          address,
          phone,
          email,
          gstin,
          logoUrl: logoUrl || null
        }
      });

      revalidatePath("/dashboard");

      return { success: true };
    })
  } catch (error: any) {
    console.error("Failed to update school profile", error);
    return { error: error.message || "Failed to update school profile" };
  }
}

