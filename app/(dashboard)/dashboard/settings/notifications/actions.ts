"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getSchoolId } from "@/lib/tenant-context";
import { NotificationCategory } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Upserts a custom user notification preference for a specific category and channel,
 * strictly bounded by the active user's session and the current school tenant context.
 */
export async function updatePreferenceAction(
  category: NotificationCategory,
  channel: "email" | "sms" | "whatsapp" | "inApp" | "push",
  enabled: boolean
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("Unauthorized: Please log in.");
  }

  const schoolId = await getSchoolId();

  // Perform a secure upsert on the database row to prevent duplicate columns
  const updated = await prisma.notificationPreference.upsert({
    where: {
      userId_schoolId_category: {
        userId,
        schoolId,
        category,
      },
    },
    update: {
      [channel]: enabled,
    },
    create: {
      userId,
      schoolId,
      category,
      email: channel === "email" ? enabled : true,      // Set default overrides
      sms: channel === "sms" ? enabled : false,
      whatsapp: channel === "whatsapp" ? enabled : false,
      push: channel === "push" ? enabled : true,
      inApp: channel === "inApp" ? enabled : true,
    },
  });

  revalidatePath("/dashboard/settings/notifications");
  return { success: true, preference: updated };
}
