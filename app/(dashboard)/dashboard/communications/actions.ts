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

export async function listCampaignsAction(page = 1, limit = 10) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      return await listCampaigns(page, limit);
    });
  } catch (e: any) {
    throw new Error(e.message || "Failed to list campaigns");
  }
}

export async function createCampaignAction(input: {
  name: string;
  subject?: string;
  content: string;
  channels: string[];
  audienceFilter: any;
}) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      const result = await createCampaign(input);
      revalidatePath("/dashboard/communications");
      return result;
    });
  } catch (e: any) {
    return { error: e.message || "Failed to create campaign" };
  }
}

export async function queueCampaignAction(id: string) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      const result = await queueCampaign(id);
      revalidatePath("/dashboard/communications");
      return result;
    });
  } catch (e: any) {
    throw new Error(e.message || "Failed to queue campaign");
  }
}

export async function cancelCampaignAction(id: string) {
  try {
    return await withTenantAuth(null, ["ADMIN"], async () => {
      const result = await cancelCampaign(id);
      revalidatePath("/dashboard/communications");
      return result;
    });
  } catch (e: any) {
    throw new Error(e.message || "Failed to cancel campaign");
  }
}

/**
 * Server action to fetch active school batches to populate builders.
 */
export async function getBatchesAction() {
  try {
    return await withTenantAuth(null, ["ADMIN"], async (config, schoolId) => {
      return await prisma.batch.findMany({
        where: { schoolId, isActive: true },
        select: { id: true, name: true },
      });
    });
  } catch (e: any) {
    throw new Error(e.message || "Failed to fetch batches");
  }
}

/**
 * Server action to fetch unique student classes to populate builders.
 */
export async function getClassesAction() {
  try {
    return await withTenantAuth(null, ["ADMIN"], async (config, schoolId) => {
      const students = await prisma.student.findMany({
        where: { schoolId, isActive: true },
        select: { class: true },
        distinct: ["class"],
      });
      return students.map((s) => s.class);
    });
  } catch (e: any) {
    throw new Error(e.message || "Failed to fetch classes");
  }
}

