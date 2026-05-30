import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withTenantAuth } from "@/lib/tenant-auth";

/**
 * GET handler for bulk campaign performance analytics.
 * Returns delivery statistics, recovery rate indices, and channels breakdown.
 */
export async function GET() {
  try {
    const data = await withTenantAuth(null, ["SUPER_ADMIN", "ADMIN"], async (_, schoolId) => {
      // 1. Fetch campaigns count
      const campaignsCount = await prisma.communicationCampaign.count({
        where: { schoolId },
      });

      // 2. Fetch recipients metrics
      const recipients = await prisma.campaignRecipient.groupBy({
        by: ["status"],
        where: {
          campaign: { schoolId },
        },
        _count: {
          userId: true,
        },
      });

      let sentCount = 0;
      let failedCount = 0;

      for (const group of recipients) {
        if (group.status === "SENT") {
          sentCount = group._count.userId;
        } else if (group.status === "FAILED") {
          failedCount = group._count.userId;
        }
      }

      const totalProcessed = sentCount + failedCount;
      const deliveryRate = totalProcessed > 0
        ? Number(((sentCount / totalProcessed) * 100).toFixed(1))
        : 100.0;

      // 3. Compile channel breakdowns dynamically from campaigns targeted channels
      const activeCampaigns = await prisma.communicationCampaign.findMany({
        where: { schoolId },
        select: {
          channels: true,
          _count: {
            select: { recipients: true },
          },
        },
      });

      const channelBreakdown = {
        email: 0,
        sms: 0,
        whatsapp: 0,
        inApp: 0,
      };

      for (const camp of activeCampaigns) {
        const channels = Array.isArray(camp.channels)
          ? camp.channels
          : [];
        const count = camp._count.recipients;

        if (channels.includes("EMAIL")) channelBreakdown.email += count;
        if (channels.includes("SMS")) channelBreakdown.sms += count;
        if (channels.includes("WHATSAPP")) channelBreakdown.whatsapp += count;
        if (channels.includes("IN_APP")) channelBreakdown.inApp += count;
      }

      return {
        campaigns: campaignsCount,
        sent: sentCount,
        failed: failedCount,
        deliveryRate,
        channelBreakdown,
      };
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err: any) {
    console.error("Failed to fetch campaigns analytics:", err);
    return NextResponse.json(
      { success: false, error: err.message || String(err) },
      { status: 500 }
    );
  }
}
