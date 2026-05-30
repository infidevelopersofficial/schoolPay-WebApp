import type { Metadata } from "next";
import Link from "next/link";
import {
  listCampaignsAction,
  queueCampaignAction,
  cancelCampaignAction,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Megaphone,
  Users,
  CheckCircle,
  AlertCircle,
  Plus,
  Clock,
  Send,
  XCircle,
  Layers,
} from "lucide-react";
import { revalidatePath } from "next/cache";

export const metadata: Metadata = {
  title: "Bulk Campaigns | SchoolPay",
  description: "Create, schedule, segment, and track institutional communication campaigns.",
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function CommunicationsDashboard({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentPage = Number(params.page ?? "1");

  // Load campaigns paginated
  const { items: campaigns, total, page, limit } = await listCampaignsAction(currentPage, 10);
  const totalPages = Math.ceil(total / limit);

  // Compute metrics server-side for fast rendering
  let sentTotal = 0;
  let failedTotal = 0;
  
  for (const campaign of campaigns) {
    // Basic aggregation for display stats
    if (campaign.status === "COMPLETED") {
      sentTotal += campaign._count.recipients;
    } else if (campaign.status === "FAILED") {
      failedTotal += campaign._count.recipients;
    }
  }
  
  const deliveryRate = (sentTotal + failedTotal) > 0
    ? Number(((sentTotal / (sentTotal + failedTotal)) * 100).toFixed(1))
    : 100.0;

  return (
    <div className="space-y-8 p-6 md:p-10 max-w-7xl mx-auto">
      {/* Header section with Premium Glassmorphism */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Bulk Communications & Campaigns
          </h1>
          <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
            Create segmented mass announcements across Email, SMS, WhatsApp, and In-App feeds.
          </p>
        </div>
        <Link href="/dashboard/communications/new">
          <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg flex items-center gap-2">
            <Plus className="h-4 w-4" /> Create Campaign
          </Button>
        </Link>
      </div>

      {/* Analytical Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 rounded-lg">
              <Megaphone className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Campaigns</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{total}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-lg">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Successful Deliveries</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{sentTotal}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-lg">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Failed Attempts</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{failedTotal}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-950/20 text-purple-600 rounded-lg">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Delivery Efficiency</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{deliveryRate}%</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Listing Section */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-950/30 backdrop-blur-md">
        <CardHeader>
          <CardTitle>Campaign Queue</CardTitle>
          <CardDescription>Monitor live sending states and execute draft campaigns.</CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-16">
              <Megaphone className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
              <h3 className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-300">No campaigns found</h3>
              <p className="text-slate-500 mt-1">Get started by creating your very first segment campaign.</p>
              <Link href="/dashboard/communications/new" className="mt-6 inline-block">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Create Campaign</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {campaigns.map((campaign) => {
                const isDraft = campaign.status === "DRAFT";
                const isQueued = campaign.status === "QUEUED";
                const isSending = campaign.status === "SENDING";

                const channels = Array.isArray(campaign.channels)
                  ? campaign.channels
                  : [];

                return (
                  <div key={campaign.id} className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">{campaign.name}</h4>
                        {/* Status Badges */}
                        {isDraft && (
                          <span className="px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400 rounded-full">
                            Draft
                          </span>
                        )}
                        {isQueued && (
                          <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 rounded-full flex items-center gap-1 animate-pulse">
                            <Clock className="h-3 w-3" /> Queued
                          </span>
                        )}
                        {isSending && (
                          <span className="px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 rounded-full flex items-center gap-1 animate-pulse">
                            <Send className="h-3 w-3 animate-bounce" /> Sending
                          </span>
                        )}
                        {campaign.status === "COMPLETED" && (
                          <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-full flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Completed
                          </span>
                        )}
                        {campaign.status === "FAILED" && (
                          <span className="px-2.5 py-0.5 text-xs font-semibold bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 rounded-full flex items-center gap-1">
                            <XCircle className="h-3 w-3" /> Failed
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl line-clamp-1">
                        {campaign.subject ? `Subject: ${campaign.subject} | ` : ""}Content: {campaign.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                        <span>Channels: {channels.join(", ")}</span>
                        <span>•</span>
                        <span>Audience: {campaign._count.recipients} Recipients</span>
                        <span>•</span>
                        <span>Created by: {campaign.createdBy.name}</span>
                      </div>
                    </div>

                    {/* Operational Buttons */}
                    <div className="flex items-center gap-3">
                      {isDraft && (
                        <form
                          action={async () => {
                            "use server";
                            await queueCampaignAction(campaign.id);
                          }}
                        >
                          <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-1">
                            <Send className="h-3.5 w-3.5" /> Queue
                          </Button>
                        </form>
                      )}
                      {(isQueued || isSending) && (
                        <form
                          action={async () => {
                            "use server";
                            await cancelCampaignAction(campaign.id);
                          }}
                        >
                          <Button type="submit" size="sm" variant="destructive" className="font-medium flex items-center gap-1">
                            <XCircle className="h-3.5 w-3.5" /> Cancel
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6 mt-6">
              <p className="text-sm text-slate-500">
                Page {page} of {totalPages} ({total} total campaigns)
              </p>
              <div className="flex items-center gap-2">
                <Link href={`/dashboard/communications?page=${page - 1}`} className={page <= 1 ? "pointer-events-none opacity-50" : ""}>
                  <Button variant="outline" size="sm">Previous</Button>
                </Link>
                <Link href={`/dashboard/communications?page=${page + 1}`} className={page >= totalPages ? "pointer-events-none opacity-50" : ""}>
                  <Button variant="outline" size="sm">Next</Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
