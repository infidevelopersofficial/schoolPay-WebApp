"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Megaphone,
  ClipboardList,
  Mail,
  Smartphone,
  MessageSquare,
  Star,
  CheckCircle,
  Eye,
  ArrowLeft,
  Users,
  Clock,
  TrendingUp,
} from "lucide-react";
import { getSurveyAnalyticsAction } from "../surveys/actions";
import { toast } from "sonner";

interface CampaignMetrics {
  campaigns: number;
  sent: number;
  failed: number;
  deliveryRate: number;
  channelBreakdown: {
    email: number;
    sms: number;
    whatsapp: number;
    inApp: number;
  };
}

interface SurveySummary {
  id: string;
  title: string;
  status: string;
  questionsCount: number;
  responsesCount: number;
}

interface AnalyticsDashboardClientProps {
  campaignMetrics: CampaignMetrics;
  surveysList: SurveySummary[];
}

export default function AnalyticsDashboardClient({
  campaignMetrics,
  surveysList,
}: AnalyticsDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"CAMPAIGNS" | "SURVEYS">("CAMPAIGNS");
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);
  const [surveyAnalytics, setSurveyAnalytics] = useState<any | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // Load detailed survey analytics dynamically when selected
  useEffect(() => {
    if (!selectedSurveyId) {
      setSurveyAnalytics(null);
      return;
    }

    const load = async () => {
      setIsLoadingAnalytics(true);
      try {
        const result = await getSurveyAnalyticsAction(selectedSurveyId);
        setSurveyAnalytics(result);
      } catch (err: any) {
        toast.error("Failed to load survey feedback stats.");
        setSelectedSurveyId(null);
      } finally {
        setIsLoadingAnalytics(false);
      }
    };

    load();
  }, [selectedSurveyId]);

  return (
    <div className="space-y-6">
      {/* Back to survey list helper inside details view */}
      {selectedSurveyId && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setSelectedSurveyId(null)}
          className="bg-white border-slate-200 text-slate-600 flex items-center gap-1.5 rounded-xl shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>
      )}

      {/* Tabs selectors (only shown if not in specific survey details view) */}
      {!selectedSurveyId && (
        <div className="flex items-center gap-2 p-1.5 border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("CAMPAIGNS")}
            className={`py-2.5 px-5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center gap-2 ${
              activeTab === "CAMPAIGNS"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Megaphone className="h-4 w-4" /> Campaign Deliveries
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("SURVEYS")}
            className={`py-2.5 px-5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center gap-2 ${
              activeTab === "SURVEYS"
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <ClipboardList className="h-4 w-4" /> Surveys & Feedbacks
          </button>
        </div>
      )}

      {/* VIEW 1: SELECTED SURVEY DETAILS ANALYTICS */}
      {selectedSurveyId && (
        <div className="space-y-6">
          {isLoadingAnalytics || !surveyAnalytics ? (
            <Card className="border border-dashed py-20 text-center rounded-2xl">
              <CardContent className="space-y-2">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" />
                <p className="text-sm text-slate-500">Compiling parent satisfaction indices...</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Detailed Header Summary */}
              <div className="bg-gradient-to-r from-violet-500/5 via-indigo-500/5 to-cyan-500/5 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                    Feedback Analysis Report
                  </span>
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                    {surveyAnalytics.title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Created on {new Date(surveyAnalytics.createdAt).toLocaleDateString()} • Status:{" "}
                    <span className="font-semibold uppercase text-indigo-600 dark:text-indigo-400">
                      {surveyAnalytics.status}
                    </span>
                  </p>
                </div>

                <div className="bg-white/80 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 rounded-lg">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Respondents</span>
                    <span className="text-xl font-black text-slate-800 dark:text-slate-200">
                      {surveyAnalytics.totalResponses} Parents
                    </span>
                  </div>
                </div>
              </div>

              {/* Loop questions results */}
              <div className="grid gap-6 md:grid-cols-2">
                {surveyAnalytics.questions.map((q: any) => {
                  return (
                    <Card
                      key={q.id}
                      className="border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/15 backdrop-blur-md rounded-2xl overflow-hidden relative shadow-sm"
                    >
                      <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-violet-500 to-indigo-600" />
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug">
                          {q.order}. {q.text}
                        </CardTitle>
                        <CardDescription className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                          Type: {q.type} • Responses: {q.answersCount}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Rating display */}
                        {q.type === "RATING" && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-3xl font-black text-amber-500">
                                {q.aggregate.average || "0.0"}
                              </span>
                              <div className="flex items-center text-amber-400">
                                <Star className="h-5 w-5 fill-amber-400" />
                              </div>
                              <span className="text-xs font-semibold text-slate-400">Average Satisfaction</span>
                            </div>

                            {/* Frequencies progress bars */}
                            <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
                              {[5, 4, 3, 2, 1].map((stars) => {
                                const count = q.aggregate.distribution[stars] || 0;
                                const pct = q.answersCount > 0 ? (count / q.answersCount) * 100 : 0;
                                return (
                                  <div key={stars} className="flex items-center gap-2">
                                    <span className="w-10 text-right font-bold text-slate-400">{stars} ★</span>
                                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2 relative overflow-hidden">
                                      <div
                                        className="bg-amber-400 rounded-full h-full"
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                    <span className="w-8 font-semibold text-slate-500">{count}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Choice selections (SINGLE / MULTIPLE) */}
                        {(q.type === "SINGLE_CHOICE" || q.type === "MULTIPLE_CHOICE") && (
                          <div className="space-y-3 text-xs">
                            {q.aggregate.choices &&
                              q.aggregate.choices.map((c: any) => {
                                return (
                                  <div key={c.option} className="space-y-1">
                                    <div className="flex items-center justify-between font-bold text-slate-600 dark:text-slate-400">
                                      <span>{c.option}</span>
                                      <span className="text-slate-500">
                                        {c.count} ({c.percentage}%)
                                      </span>
                                    </div>
                                    <div className="bg-slate-100 dark:bg-slate-800 rounded-full h-2 relative overflow-hidden">
                                      <div
                                        className="bg-gradient-to-r from-violet-500 to-indigo-600 rounded-full h-full"
                                        style={{ width: `${c.percentage}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        )}

                        {/* Text inputs */}
                        {q.type === "TEXT" && (
                          <div className="space-y-2 max-h-[160px] overflow-y-auto divide-y divide-slate-50 dark:divide-slate-850 pr-2">
                            {q.aggregate.recentResponses && q.aggregate.recentResponses.length > 0 ? (
                              q.aggregate.recentResponses.map((t: string, tIdx: number) => (
                                <p
                                  key={tIdx}
                                  className="text-xs text-slate-500 dark:text-slate-400 italic pt-2 first:pt-0 leading-relaxed"
                                >
                                  "{t}"
                                </p>
                              ))
                            ) : (
                              <p className="text-xs text-slate-400 py-4 text-center">No textual suggestions submitted yet.</p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: CAMPAIGNS TAB */}
      {!selectedSurveyId && activeTab === "CAMPAIGNS" && (
        <div className="space-y-6">
          {/* Campaigns Analytical grid */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 shadow-sm">
              <CardContent className="p-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Mass Campaigns</span>
                <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">
                  {campaignMetrics.campaigns}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Total institutional broadcasts</p>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 shadow-sm">
              <CardContent className="p-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Successful</span>
                <h3 className="text-3xl font-black text-emerald-600 mt-1">
                  {campaignMetrics.sent}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Sent outbox alerts</p>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 shadow-sm">
              <CardContent className="p-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Delivery efficiency</span>
                <h3 className="text-3xl font-black text-indigo-600 mt-1">
                  {campaignMetrics.deliveryRate}%
                </h3>
                <p className="text-xs text-slate-400 mt-1">Success delivery quotient</p>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 shadow-sm">
              <CardContent className="p-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Bounced</span>
                <h3 className="text-3xl font-black text-red-500 mt-1">
                  {campaignMetrics.failed}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Failed outbound bounds</p>
              </CardContent>
            </Card>
          </div>

          {/* Delivery Channel breakdowns card */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-950/30 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Delivery Channels Analytics</CardTitle>
              <CardDescription>Aggregate processed recipients and metrics breakdown by communications channel.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  channel: "Email Broadcasts",
                  count: campaignMetrics.channelBreakdown.email,
                  pct:
                    campaignMetrics.sent > 0
                      ? (campaignMetrics.channelBreakdown.email / campaignMetrics.sent) * 100
                      : 0,
                  icon: Mail,
                  color: "from-blue-500 to-cyan-500",
                },
                {
                  channel: "SMS Notifications",
                  count: campaignMetrics.channelBreakdown.sms,
                  pct:
                    campaignMetrics.sent > 0
                      ? (campaignMetrics.channelBreakdown.sms / campaignMetrics.sent) * 100
                      : 0,
                  icon: Smartphone,
                  color: "from-indigo-500 to-purple-650",
                },
                {
                  channel: "WhatsApp Messenger API",
                  count: campaignMetrics.channelBreakdown.whatsapp,
                  pct:
                    campaignMetrics.sent > 0
                      ? (campaignMetrics.channelBreakdown.whatsapp / campaignMetrics.sent) * 100
                      : 0,
                  icon: MessageSquare,
                  color: "from-emerald-500 to-teal-500",
                },
                {
                  channel: "In-App Alerts Feed",
                  count: campaignMetrics.channelBreakdown.inApp,
                  pct:
                    campaignMetrics.sent > 0
                      ? (campaignMetrics.channelBreakdown.inApp / campaignMetrics.sent) * 100
                      : 0,
                  icon: Megaphone,
                  color: "from-violet-500 to-pink-500",
                },
              ].map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.channel} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-350">
                        <Icon className="h-4 w-4 text-indigo-500" />
                        <span>{c.channel}</span>
                      </div>
                      <span className="font-semibold text-slate-500">
                        {c.count} Recipients ({c.pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-full h-3 relative overflow-hidden">
                      <div
                        className={`bg-gradient-to-r ${c.color} rounded-full h-full`}
                        style={{ width: `${c.pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* VIEW 3: SURVEYS TAB */}
      {!selectedSurveyId && activeTab === "SURVEYS" && (
        <Card className="border border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-950/30 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Active Surveys Analysis</CardTitle>
            <CardDescription>Select any active survey to inspect complete question ratings and choice percentage maps.</CardDescription>
          </CardHeader>
          <CardContent>
            {surveysList.length === 0 ? (
              <p className="text-slate-400 text-center py-10 text-sm">No surveys found to compile analytics.</p>
            ) : (
              <div className="divide-y divide-slate-150 dark:divide-slate-800">
                {surveysList.map((s) => {
                  return (
                    <div
                      key={s.id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-850 dark:text-slate-200 text-sm">{s.title}</h4>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span>Questions: {s.questionsCount} Fields</span>
                          <span>•</span>
                          <span>Status: <span className="font-bold uppercase text-[10px] text-indigo-500">{s.status}</span></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-450 block">Responses</span>
                          <span className="text-sm font-black text-slate-700 dark:text-slate-300">
                            {s.responsesCount} Submitted
                          </span>
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setSelectedSurveyId(s.id)}
                          className="bg-indigo-650 hover:bg-indigo-750 text-white flex items-center gap-1 text-xs"
                        >
                          <Eye className="h-3.5 w-3.5" /> View Feedback
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
