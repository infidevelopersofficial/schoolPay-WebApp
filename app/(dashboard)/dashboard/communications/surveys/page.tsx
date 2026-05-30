import type { Metadata } from "next";
import Link from "next/link";
import {
  listSurveysAction,
  publishSurveyAction,
  closeSurveyAction,
  deleteSurveyAction,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ClipboardList,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  Calendar,
  Send,
  Eye,
  TrendingUp,
} from "lucide-react";
import { revalidatePath } from "next/cache";

export const metadata: Metadata = {
  title: "Institutional Surveys | SchoolPay",
  description: "Create, distribute, and analyze targeted surveys and feedback collection.",
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export default async function SurveysDashboard({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentPage = Number(params.page ?? "1");

  const { items: surveys, total, page, limit } = await listSurveysAction(currentPage, 10);
  const totalPages = Math.ceil(total / limit);

  // Stats calculation
  const totalResponses = surveys.reduce((sum, s) => sum + s._count.responses, 0);
  const publishedCount = surveys.filter((s) => s.status === "PUBLISHED").length;
  const closedCount = surveys.filter((s) => s.status === "CLOSED").length;

  return (
    <div className="space-y-8 p-6 md:p-10 max-w-7xl mx-auto">
      {/* Header section with Premium Glassmorphism */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
            Surveys & Feedback Collection
          </h1>
          <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
            Publish questionnaires to targeted parents/students and monitor aggregated satisfaction indices.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/communications">
            <Button variant="outline" className="border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
              Campaigns
            </Button>
          </Link>
          <Link href="/dashboard/communications/surveys/new">
            <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg flex items-center gap-2">
              <Plus className="h-4 w-4" /> Create Survey
            </Button>
          </Link>
        </div>
      </div>

      {/* Analytical Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-violet-50 dark:bg-violet-950/20 text-violet-600 rounded-lg">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Surveys</p>
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
              <p className="text-sm font-medium text-slate-500">Active Published</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{publishedCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 rounded-lg">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Responses Collected</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalResponses}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-cyan-50 dark:bg-cyan-950/20 text-cyan-600 rounded-lg">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Closed Polls</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{closedCount}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Surveys Listing Section */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white/30 dark:bg-slate-950/30 backdrop-blur-md">
        <CardHeader>
          <CardTitle>School Surveys</CardTitle>
          <CardDescription>Track distribution statuses and manage active questionnaires.</CardDescription>
        </CardHeader>
        <CardContent>
          {surveys.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardList className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
              <h3 className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-300">No surveys drafted</h3>
              <p className="text-slate-500 mt-1">Get started by creating your very first segment satisfaction poll.</p>
              <Link href="/dashboard/communications/surveys/new" className="mt-6 inline-block">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Compose Survey</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {surveys.map((survey) => {
                const isDraft = survey.status === "DRAFT";
                const isPublished = survey.status === "PUBLISHED";
                const isClosed = survey.status === "CLOSED";

                const filter = survey.audienceFilter as any;
                const segmentText = filter?.segmentType
                  ? filter.segmentType.replace(/_/g, " ")
                  : "All School";

                return (
                  <div key={survey.id} className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">{survey.title}</h4>
                        {/* Status Badges */}
                        {isDraft && (
                          <span className="px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400 rounded-full">
                            Draft
                          </span>
                        )}
                        {isPublished && (
                          <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-full flex items-center gap-1">
                            <Send className="h-3 w-3" /> Published
                          </span>
                        )}
                        {isClosed && (
                          <span className="px-2.5 py-0.5 text-xs font-semibold bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 rounded-full flex items-center gap-1">
                            <XCircle className="h-3 w-3" /> Closed
                          </span>
                        )}
                      </div>
                      {survey.description && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl line-clamp-1">
                          {survey.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 flex-wrap">
                        <span>Target: <span className="font-semibold uppercase">{segmentText}</span></span>
                        <span>•</span>
                        <span>Questions: {survey.questions.length} Fields</span>
                        <span>•</span>
                        <span>Responses: <span className="font-bold text-slate-700 dark:text-slate-300">{survey._count.responses} Users</span></span>
                        {survey.expiresAt && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-amber-500">
                              <Calendar className="h-3 w-3" /> Expires: {new Date(survey.expiresAt).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Operational Actions */}
                    <div className="flex items-center gap-3">
                      {isDraft && (
                        <form
                          action={async () => {
                            "use server";
                            await publishSurveyAction(survey.id);
                          }}
                        >
                          <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-1">
                            <Send className="h-3.5 w-3.5" /> Publish
                          </Button>
                        </form>
                      )}
                      {isPublished && (
                        <form
                          action={async () => {
                            "use server";
                            await closeSurveyAction(survey.id);
                          }}
                        >
                          <Button type="submit" size="sm" variant="outline" className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                            <XCircle className="h-3.5 w-3.5 text-red-500" /> Close
                          </Button>
                        </form>
                      )}

                      {/* Delete always available */}
                      <form
                        action={async () => {
                          "use server";
                          await deleteSurveyAction(survey.id);
                        }}
                      >
                        <Button type="submit" size="sm" variant="ghost" className="text-slate-400 hover:text-red-500 p-2">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
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
                Page {page} of {totalPages} ({total} total surveys)
              </p>
              <div className="flex items-center gap-2">
                <Link href={`/dashboard/communications/surveys?page=${page - 1}`} className={page <= 1 ? "pointer-events-none opacity-50" : ""}>
                  <Button variant="outline" size="sm">Previous</Button>
                </Link>
                <Link href={`/dashboard/communications/surveys?page=${page + 1}`} className={page >= totalPages ? "pointer-events-none opacity-50" : ""}>
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
