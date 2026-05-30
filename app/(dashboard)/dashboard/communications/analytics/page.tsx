import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getSchoolId } from "@/lib/tenant-context";
import { withTenantRead } from "@/lib/dal/core";
import AnalyticsDashboardClient from "./analytics-client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Communications & Feedback Analytics | SchoolPay",
  description: "Aggregated performance charts and parental satisfaction indices.",
};

export default async function CommunicationsAnalyticsPage() {
  const schoolId = await getSchoolId();

  // 1. Fetch campaigns metrics
  const campaignsCount = await prisma.communicationCampaign.count({
    where: { schoolId },
  });

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

  // Compile channels statistics
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
    const channels = Array.isArray(camp.channels) ? (camp.channels as string[]) : [];
    const count = camp._count.recipients;

    if (channels.includes("EMAIL")) channelBreakdown.email += count;
    if (channels.includes("SMS")) channelBreakdown.sms += count;
    if (channels.includes("WHATSAPP")) channelBreakdown.whatsapp += count;
    if (channels.includes("IN_APP")) channelBreakdown.inApp += count;
  }

  const campaignMetrics = {
    campaigns: campaignsCount,
    sent: sentCount,
    failed: failedCount,
    deliveryRate,
    channelBreakdown,
  };

  // 2. Fetch surveys list summaries
  const surveys = await prisma.survey.findMany({
    where: { schoolId },
    select: {
      id: true,
      title: true,
      status: true,
      questions: { select: { id: true } },
      _count: { select: { responses: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const surveysList = surveys.map((s) => ({
    id: s.id,
    title: s.title,
    status: s.status,
    questionsCount: s.questions.length,
    responsesCount: s._count.responses,
  }));

  return (
    <div className="space-y-8 p-6 md:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-650 via-purple-650 to-pink-600 bg-clip-text text-transparent">
            Communications & Feedback Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
            Real-time delivery statistics and aggregated parental satisfaction surveys indices.
          </p>
        </div>

        <Link href="/dashboard/communications">
          <Button variant="outline" className="border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1.5 rounded-xl">
            <ArrowLeft className="h-4 w-4" /> Campaigns Queue
          </Button>
        </Link>
      </div>

      {/* Render interactive client analytics panels */}
      <AnalyticsDashboardClient
        campaignMetrics={campaignMetrics}
        surveysList={surveysList}
      />
    </div>
  );
}
