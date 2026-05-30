import { withTenantRead } from "@/lib/dal/core";
import { prisma } from "@/lib/prisma";
import { withDAL } from "@/lib/dal/utils";
import { getSchoolId, getTenantContext } from "@/lib/tenant-context";
import { recordAuditLog } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { resolveAudienceFilters } from "@/lib/communication/audience-segment";
import { logger } from "@/lib/logger";
import { THRESHOLDS } from "@/lib/observability/performance";
import { CampaignStatus } from "@prisma/client";

const log = logger.child({ domain: "campaigns.dal" });

export interface CreateCampaignInput {
  name: string;
  subject?: string;
  content: string;
  channels: string[]; // ["EMAIL", "SMS", etc.]
  audienceFilter: any;
}

/**
 * Creates a communication campaign in DRAFT mode.
 */
export async function createCampaign(input: CreateCampaignInput) {
  const schoolId = await getSchoolId();
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("User context is required for campaign creation");
  }

  return withDAL(
    "campaigns.create",
    async () => {
      const campaign = await prisma.communicationCampaign.create({
        data: {
          schoolId,
          name: input.name,
          subject: input.subject,
          content: input.content,
          channels: input.channels,
          audienceFilter: input.audienceFilter,
          createdById: userId,
          status: "DRAFT",
        },
      });

      await recordAuditLog({
        action: "CREATE",
        entityType: "COMMUNICATION_CAMPAIGN",
        entityId: campaign.id,
        schoolId,
        newValues: input,
        description: `Created communication campaign draft: ${campaign.name}`,
      });

      return campaign;
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY }
  );
}

/**
 * Updates a draft communication campaign.
 */
export async function updateCampaign(id: string, input: Partial<CreateCampaignInput>) {
  const schoolId = await getSchoolId();

  return withDAL(
    "campaigns.update",
    async () => {
      const campaign = await prisma.communicationCampaign.findFirst({
        where: { id, schoolId },
      });

      if (!campaign) {
        throw new Error("Campaign not found");
      }

      if (campaign.status !== "DRAFT") {
        throw new Error("Only campaign drafts can be updated");
      }

      const updated = await prisma.communicationCampaign.update({
        where: { id },
        data: {
          name: input.name,
          subject: input.subject,
          content: input.content,
          channels: input.channels ? input.channels : undefined,
          audienceFilter: input.audienceFilter ? input.audienceFilter : undefined,
        },
      });

      await recordAuditLog({
        action: "UPDATE",
        entityType: "COMMUNICATION_CAMPAIGN",
        entityId: id,
        schoolId,
        newValues: input,
        description: `Updated campaign draft: ${campaign.name}`,
      });

      return updated;
    },
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY }
  );
}

/**
 * Resolves audience filters and queues the campaign for asynchronous processing.
 */
export async function queueCampaign(id: string) {
  const schoolId = await getSchoolId();

  return withDAL(
    "campaigns.queue",
    async () => {
      const campaign = await prisma.communicationCampaign.findFirst({
        where: { id, schoolId },
      });

      if (!campaign) {
        throw new Error("Campaign not found");
      }

      if (campaign.status !== "DRAFT") {
        throw new Error("Only drafts can be queued for execution");
      }

      // Resolve dynamic audience filters
      const filter = campaign.audienceFilter as any;
      const recipients = await resolveAudienceFilters(schoolId, filter);

      if (recipients.length === 0) {
        throw new Error("Target audience segmentation resolved to 0 recipients");
      }

      // Populate CampaignRecipient rows inside a single database transaction
      await prisma.$transaction(async (tx) => {
        // Update campaign status
        await tx.communicationCampaign.update({
          where: { id },
          data: {
            status: "QUEUED",
            scheduledAt: new Date(),
          },
        });

        // Batch insert recipients, ignoring existing relations to ensure safety
        const recipientData = recipients.map((r) => ({
          campaignId: id,
          userId: r.userId,
          status: "PENDING" as const,
        }));

        // Delete any existing recipients for this campaign to prevent duplicates on re-queueing
        await tx.campaignRecipient.deleteMany({
          where: { campaignId: id },
        });

        await tx.campaignRecipient.createMany({
          data: recipientData,
          skipDuplicates: true,
        });
      });

      await recordAuditLog({
        action: "UPDATE",
        entityType: "COMMUNICATION_CAMPAIGN",
        entityId: id,
        schoolId,
        newValues: { status: "QUEUED" },
        description: `Queued campaign for execution: ${campaign.name} with ${recipients.length} recipients`,
      });

      return { success: true, count: recipients.length };
    },
    { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY }
  );
}

/**
 * Cancels a queued campaign and rolls it back to DRAFT mode.
 */
export async function cancelCampaign(id: string) {
  const schoolId = await getSchoolId();

  return withDAL(
    "campaigns.cancel",
    async () => {
      const campaign = await prisma.communicationCampaign.findFirst({
        where: { id, schoolId },
      });

      if (!campaign) {
        throw new Error("Campaign not found");
      }

      if (campaign.status !== "QUEUED" && campaign.status !== "SENDING") {
        throw new Error("Only queued or sending campaigns can be cancelled");
      }

      await prisma.$transaction(async (tx) => {
        // Rollback campaign status
        await tx.communicationCampaign.update({
          where: { id },
          data: {
            status: "DRAFT",
            startedAt: null,
            completedAt: null,
          },
        });

        // Clear pre-populated recipients
        await tx.campaignRecipient.deleteMany({
          where: { campaignId: id },
        });
      });

      await recordAuditLog({
        action: "UPDATE",
        entityType: "COMMUNICATION_CAMPAIGN",
        entityId: id,
        schoolId,
        newValues: { status: "DRAFT" },
        description: `Cancelled and reset campaign to draft: ${campaign.name}`,
      });

      return { success: true };
    },
    { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY }
  );
}

/**
 * Fetches a single campaign by ID.
 */
export async function getCampaign(id: string) {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId();

    return withDAL(
      "campaigns.get",
      async () => {
        return prisma.communicationCampaign.findFirst({
          where: { id, schoolId },
          include: {
            createdBy: {
              select: { name: true, email: true },
            },
            _count: {
              select: { recipients: true },
            },
          },
        });
      },
      { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY }
    );
  });
}

/**
 * Lists paginated campaigns scoped to school.
 */
export async function listCampaigns(page = 1, limit = 10) {
  return withTenantRead(async () => {
    const schoolId = await getSchoolId();
    const skip = (page - 1) * limit;

    return withDAL(
      "campaigns.list",
      async () => {
        const [items, total] = await prisma.$transaction([
          prisma.communicationCampaign.findMany({
            where: { schoolId },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            include: {
              createdBy: { select: { name: true } },
              _count: { select: { recipients: true } },
            },
          }),
          prisma.communicationCampaign.count({
            where: { schoolId },
          }),
        ]);

        return { items, total, page, limit };
      },
      { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY }
    );
  });
}
