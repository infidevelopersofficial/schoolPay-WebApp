import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hydrateTemplate } from "@/lib/communication/hydrator";
import { publishEvent } from "@/lib/events/emitter";

/**
 * Worker endpoint for asynchronous bulk campaign emission.
 * Invoked by scheduler/cron triggers, protected via CRON_SECRET authorization.
 */
export async function POST(request: Request) {
  return handleJob(request);
}

export async function GET(request: Request) {
  return handleJob(request);
}

async function handleJob(request: Request) {
  try {
    // 1. Cron secret authorization guard
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get("authorization");
      const searchParams = new URL(request.url).searchParams;
      const querySecret = searchParams.get("secret");

      const isAuthorized =
        authHeader === `Bearer ${cronSecret}` || querySecret === cronSecret;

      if (!isAuthorized) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const batchSize = 100;
    const now = new Date();

    // 2. Fetch campaigns due for processing (status = QUEUED or SENDING)
    const campaigns = await prisma.communicationCampaign.findMany({
      where: {
        status: {
          in: ["QUEUED", "SENDING"],
        },
      },
      include: {
        _count: {
          select: {
            recipients: {
              where: { status: "PENDING" },
            },
          },
        },
      },
    });

    let processedCount = 0;
    let completedCampaigns = 0;

    for (const campaign of campaigns) {
      // Transition status to SENDING on start
      if (campaign.status === "QUEUED") {
        await prisma.communicationCampaign.update({
          where: { id: campaign.id },
          data: {
            status: "SENDING",
            startedAt: now,
          },
        });
      }

      // Fetch pending recipients in blocks of 100
      const pendingRecipients = await prisma.campaignRecipient.findMany({
        where: {
          campaignId: campaign.id,
          status: "PENDING",
        },
        take: batchSize,
      });

      if (pendingRecipients.length === 0) {
        // No pending recipients remaining, mark campaign as COMPLETED
        await prisma.communicationCampaign.update({
          where: { id: campaign.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });
        completedCampaigns++;
        continue;
      }

      for (const recipient of pendingRecipients) {
        const userId = recipient.userId;
        const schoolId = campaign.schoolId;

        try {
          // Resolve linked student ID to parse personalization variables
          let studentId: string | null = null;
          const student = await prisma.student.findFirst({
            where: {
              OR: [
                { userId },
                { parent: { userId } },
              ],
            },
            select: { id: true },
          });
          if (student) {
            studentId = student.id;
          }

          // Hydrate dynamic placeholders
          const subject = campaign.subject
            ? await hydrateTemplate(campaign.subject, studentId, schoolId)
            : "";
          const content = await hydrateTemplate(campaign.content, studentId, schoolId);

          // Execute outbox publishing and recipient completion in a transaction
          await prisma.$transaction(async (tx) => {
            await publishEvent({
              eventType: "CAMPAIGN_MESSAGE",
              entityType: "CAMPAIGN",
              entityId: campaign.id,
              schoolId,
              tx,
              payload: {
                userId,
                schoolId,
                subject,
                content,
                channels: campaign.channels, // Pass along targeted channels
              },
            });

            await tx.campaignRecipient.update({
              where: { id: recipient.id },
              data: {
                status: "SENT",
                sentAt: new Date(),
                errorMessage: null,
              },
            });
          });

          processedCount++;
        } catch (itemErr: any) {
          console.error(`Failed to process campaign recipient ${recipient.id}:`, itemErr);
          
          // Partial failure recovery: fail only this recipient, proceed with remainder
          try {
            await prisma.campaignRecipient.update({
              where: { id: recipient.id },
              data: {
                status: "FAILED",
                errorMessage: itemErr.message || String(itemErr),
              },
            });
          } catch (dbErr) {
            console.error("Critical: Failed to save recipient failure log", dbErr);
          }
        }
      }

      // Check if all pending recipients are now processed for this campaign
      const remainingPending = await prisma.campaignRecipient.count({
        where: {
          campaignId: campaign.id,
          status: "PENDING",
        },
      });

      if (remainingPending === 0) {
        await prisma.communicationCampaign.update({
          where: { id: campaign.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });
        completedCampaigns++;
      }
    }

    return NextResponse.json({
      success: true,
      processedRecipients: processedCount,
      completedCampaigns,
    });
  } catch (err: any) {
    console.error("Critical error in process-campaigns job handler:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || String(err),
      },
      { status: 500 }
    );
  }
}
