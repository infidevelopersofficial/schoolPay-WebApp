import type { Metadata } from "next";
import Link from "next/link";
import { listSurveysForParent } from "@/lib/dal/surveys";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  ChevronRight,
  ArrowLeft,
  Calendar,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Surveys & Feedback — Parent Portal",
  description: "Share your feedback with school administration on active surveys.",
};

export default async function ParentSurveysPage() {
  const surveys = await listSurveysForParent();

  return (
    <div className="space-y-8 p-6 md:p-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-violet-600" />
            Surveys & Feedback
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Voice your opinions on school policies, schedules, facilities, and activities.
          </p>
        </div>
        <Link href="/parent/dashboard">
          <Button variant="outline" size="sm" className="border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Button>
        </Link>
      </div>

      {surveys.length === 0 ? (
        <Card className="border-dashed py-16 text-center">
          <CardContent>
            <ClipboardList className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
            <h3 className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-300">No active surveys</h3>
            <p className="text-slate-500 mt-1">There are no questionnaires targeted to your children at this time.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {surveys.map((survey) => {
            const isCompleted = survey.isCompleted;

            return (
              <Card
                key={survey.id}
                className={`border transition-all duration-300 flex flex-col justify-between ${
                  isCompleted
                    ? "border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/20"
                    : "border-violet-200 dark:border-violet-950/40 bg-white/80 dark:bg-slate-900 shadow-md shadow-violet-500/5 ring-1 ring-violet-500/5"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                    {/* Status Badge */}
                    {isCompleted ? (
                      <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Completed
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 text-xs font-semibold bg-violet-50 text-violet-600 dark:bg-violet-950/20 dark:text-violet-400 rounded-full flex items-center gap-1 animate-pulse">
                        <Clock className="h-3 w-3" /> Pending Feedback
                      </span>
                    )}

                    {survey.expiresAt && (
                      <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                        <Calendar className="h-3 w-3" /> Closes: {new Date(survey.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-200 line-clamp-2">
                    {survey.title}
                  </CardTitle>
                  {survey.description && (
                    <CardDescription className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {survey.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0 pb-6 flex items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800/50 mt-4 pt-4">
                  <span className="text-xs text-slate-400 font-semibold">
                    {survey.questions.length} Question{survey.questions.length > 1 ? "s" : ""}
                  </span>
                  
                  {isCompleted ? (
                    <Button disabled variant="outline" size="sm" className="text-slate-400 border-slate-200 bg-slate-50/50">
                      Response Submitted
                    </Button>
                  ) : (
                    <Link href={`/parent/surveys/${survey.id}`}>
                      <Button size="sm" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold flex items-center gap-1 shadow-md shadow-indigo-600/10">
                        Take Survey <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
