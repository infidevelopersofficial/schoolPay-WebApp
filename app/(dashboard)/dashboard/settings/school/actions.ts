"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSchoolId } from "@/lib/tenant-context";
import { revalidatePath, revalidateTag } from "next/cache";

export async function updateSchoolProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const schoolId = await getSchoolId();
  if (!schoolId) {
    return { error: "No active school" };
  }

  const name = formData.get("name") as string;
  const address = formData.get("address") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const gstin = formData.get("gstin") as string;
  const logoUrl = formData.get("logoUrl") as string;

  try {
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
  } catch (error) {
    console.error("Failed to update school profile", error);
    return { error: "Failed to update school profile" };
  }
}
