import type { Metadata } from "next";
import { getSurvey } from "@/lib/dal/surveys";
import TakeSurvey from "./take-survey";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Take Survey | Parent Portal",
  description: "Share your feedback with school administration.",
};

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TakeSurveyPage({ params }: PageProps) {
  const resolvedParams = await params;
  const survey = await getSurvey(resolvedParams.id);

  if (!survey) {
    return (
      <div className="space-y-8 p-6 md:p-10 max-w-md mx-auto text-center py-20">
        <ClipboardList className="mx-auto h-12 w-12 text-slate-300" />
        <h3 className="mt-4 text-lg font-semibold text-slate-700">Survey not found</h3>
        <p className="text-slate-500 mt-1">This questionnaire does not exist or has been removed.</p>
        <Link href="/parent/surveys" className="mt-6 inline-block">
          <Button variant="outline">Return to Surveys</Button>
        </Link>
      </div>
    );
  }

  // Enforce duplicate check at server level
  const hasResponded = survey.responses && survey.responses.length > 0;

  if (hasResponded) {
    return (
      <div className="space-y-6 p-6 md:p-10 max-w-lg mx-auto text-center py-20">
        <Card className="border border-emerald-100 bg-emerald-50/20 rounded-2xl p-8 shadow-sm">
          <CardContent className="space-y-4 p-0">
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600 animate-bounce" />
            <h2 className="text-2xl font-bold text-slate-800">Response Already Submitted</h2>
            <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
              You have already completed the questionnaire for <strong>"{survey.title}"</strong>. Each parent is locked to a single submission to guarantee survey fairness.
            </p>
            <div className="pt-4">
              <Link href="/parent/surveys">
                <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold flex items-center gap-1.5 mx-auto rounded-xl shadow-md">
                  <ArrowLeft className="h-4 w-4" /> Go Back to List
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <TakeSurvey survey={survey as any} />;
}
