"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, ArrowLeft, Send } from "lucide-react";
import { submitSurveyResponseAction } from "@/app/(dashboard)/dashboard/communications/surveys/actions";
import { toast } from "sonner";

interface Question {
  id: string;
  order: number;
  type: "TEXT" | "RATING" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
  text: string;
  options: any; // string[] Choice options
  isRequired: boolean;
}

interface TakeSurveyProps {
  survey: {
    id: string;
    title: string;
    description: string | null;
    questions: Question[];
  };
}

export default function TakeSurvey({ survey }: TakeSurveyProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Star Rating Hover/Select State
  const [hoverRating, setHoverRating] = useState<Record<string, number>>({});

  const handleTextChange = (qId: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const handleRatingChange = (qId: string, val: number) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const handleSingleChoiceChange = (qId: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const handleMultipleChoiceChange = (qId: string, option: string, isChecked: boolean) => {
    setAnswers((prev) => {
      const currentList: string[] = prev[qId] || [];
      const updatedList = isChecked
        ? [...currentList, option]
        : currentList.filter((x) => x !== option);
      return { ...prev, [qId]: updatedList };
    });
  };

  const validate = (): boolean => {
    for (const q of survey.questions) {
      if (q.isRequired) {
        const ans = answers[q.id];
        if (ans === undefined || ans === null) {
          toast.error(`"${q.text}" requires an answer.`);
          return false;
        }
        if (q.type === "TEXT" && String(ans).trim().length === 0) {
          toast.error(`"${q.text}" requires an answer.`);
          return false;
        }
        if ((q.type === "MULTIPLE_CHOICE") && (Array.isArray(ans) && ans.length === 0)) {
          toast.error(`"${q.text}" requires at least one selection.`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      // Map answers map to the expected backend payload array
      const answerPayload = survey.questions.map((q) => {
        let rawAnswer = answers[q.id];
        // Handle empty defaults
        if (rawAnswer === undefined || rawAnswer === null) {
          rawAnswer = q.type === "MULTIPLE_CHOICE" ? [] : "";
        }
        return {
          questionId: q.id,
          answer: rawAnswer,
        };
      });

      await submitSurveyResponseAction(survey.id, answerPayload);
      toast.success("Survey feedback submitted successfully! Thank you.");
      router.push("/parent/surveys");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit survey");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 p-6 md:p-10 max-w-3xl mx-auto">
      {/* Back Button & Header */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => router.push("/parent/surveys")}
          className="rounded-full bg-white border-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{survey.title}</h1>
          {survey.description && (
            <p className="text-sm text-slate-500 mt-1">{survey.description}</p>
          )}
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {survey.questions.map((q, idx) => {
          const isRequired = q.isRequired;
          const currentAnswer = answers[q.id];

          return (
            <Card
              key={q.id}
              className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden"
            >
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 leading-snug">
                    {idx + 1}. {q.text}{" "}
                    {isRequired && <span className="text-red-500 font-bold">*</span>}
                  </h3>
                </div>

                {/* Question Type: TEXT */}
                {q.type === "TEXT" && (
                  <textarea
                    rows={4}
                    placeholder="Type your response here..."
                    value={currentAnswer || ""}
                    onChange={(e) => handleTextChange(q.id, e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm focus:border-violet-500 focus:outline-none"
                  />
                )}

                {/* Question Type: RATING */}
                {q.type === "RATING" && (
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isGold =
                        hoverRating[q.id] !== undefined
                          ? star <= hoverRating[q.id]
                          : star <= (currentAnswer || 0);

                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRatingChange(q.id, star)}
                          onMouseEnter={() => setHoverRating((prev) => ({ ...prev, [q.id]: star }))}
                          onMouseLeave={() =>
                            setHoverRating((prev) => {
                              const copy = { ...prev };
                              delete copy[q.id];
                              return copy;
                            })
                          }
                          className="p-1 transition-all hover:scale-125 duration-150"
                        >
                          <Star
                            className={`h-8 w-8 transition-colors duration-200 ${
                              isGold
                                ? "fill-amber-400 text-amber-400 drop-shadow-md"
                                : "text-slate-300 dark:text-slate-700"
                            }`}
                          />
                        </button>
                      );
                    })}
                    {currentAnswer && (
                      <span className="text-sm font-bold text-amber-500 ml-2">
                        {currentAnswer} / 5 Rating
                      </span>
                    )}
                  </div>
                )}

                {/* Question Type: SINGLE_CHOICE */}
                {q.type === "SINGLE_CHOICE" && (
                  <div className="grid gap-3">
                    {Array.isArray(q.options) &&
                      (q.options as string[]).map((opt) => {
                        const isSelected = currentAnswer === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleSingleChoiceChange(q.id, opt)}
                            className={`text-left px-5 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                              isSelected
                                ? "border-violet-600 bg-violet-50/20 text-violet-700 dark:border-violet-500 dark:text-violet-400 dark:bg-violet-950/10 shadow-sm"
                                : "border-slate-200 bg-white/50 dark:border-slate-800 dark:bg-slate-900/50 hover:border-slate-300"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                  </div>
                )}

                {/* Question Type: MULTIPLE_CHOICE */}
                {q.type === "MULTIPLE_CHOICE" && (
                  <div className="grid gap-3">
                    {Array.isArray(q.options) &&
                      (q.options as string[]).map((opt) => {
                        const list: string[] = currentAnswer || [];
                        const isSelected = list.includes(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleMultipleChoiceChange(q.id, opt, !isSelected)}
                            className={`text-left px-5 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 flex items-center justify-between ${
                              isSelected
                                ? "border-violet-600 bg-violet-50/20 text-violet-700 dark:border-violet-500 dark:text-violet-400 dark:bg-violet-950/10 shadow-sm"
                                : "border-slate-200 bg-white/50 dark:border-slate-800 dark:bg-slate-900/50 hover:border-slate-300"
                            }`}
                          >
                            <span>{opt}</span>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="h-4 w-4 text-violet-600 border-slate-300 rounded focus:ring-violet-500 cursor-pointer pointer-events-none"
                            />
                          </button>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Submit Action */}
        <div className="flex items-center justify-end pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/20 flex items-center gap-1.5 rounded-xl py-5 px-6"
          >
            {isSubmitting ? (
              "Submitting Response..."
            ) : (
              <>
                Submit Survey Response <Send className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
