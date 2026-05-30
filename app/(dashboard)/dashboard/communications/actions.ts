"use server";

import { revalidatePath } from "next/cache";
import {
  createCampaign,
  queueCampaign,
  cancelCampaign,
  listCampaigns,
} from "@/lib/dal/campaigns";
import { withTenantAuth } from "@/lib/tenant-auth";
import { prisma } from "@/lib/prisma";
import { getSchoolId } from "@/lib/tenant-context";

export async function listCampaignsAction(page = 1, limit = 10) {
  return await listCampaigns(page, limit);
}

export async function createCampaignAction(input: {
  name: string;
  subject?: string;
  content: string;
  channels: string[];
  audienceFilter: any;
}) {
  const result = await createCampaign(input);
  revalidatePath("/dashboard/communications");
  return result;
}

export async function queueCampaignAction(id: string) {
  const result = await queueCampaign(id);
  revalidatePath("/dashboard/communications");
  return result;
}

export async function cancelCampaignAction(id: string) {
  const result = await cancelCampaign(id);
  revalidatePath("/dashboard/communications");
  return result;
}

/**
 * Server action to fetch active school batches to populate builders.
 */
export async function getBatchesAction() {
  const schoolId = await getSchoolId();
  return await prisma.batch.findMany({
    where: { schoolId, isActive: true },
    select: { id: true, name: true },
  });
}

/**
 * Server action to fetch unique student classes to populate builders.
 */
export async function getClassesAction() {
  const schoolId = await getSchoolId();
  const students = await prisma.student.findMany({
    where: { schoolId, isActive: true },
    select: { class: true },
    distinct: ["class"],
  });
  return students.map((s) => s.class);
}
