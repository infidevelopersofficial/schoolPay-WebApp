"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  Trash2,
  ListPlus,
  Star,
  Type,
  CheckSquare,
  HelpCircle,
  Users,
  Calendar,
  Layers,
  ChevronLeft,
  Send,
  Save,
} from "lucide-react";
import { createSurveyAction, publishSurveyAction } from "../actions";
import { toast } from "sonner";

interface Batch {
  id: string;
  name: string;
}

interface SurveyBuilderProps {
  batches: Batch[];
  classes: string[];
}

type QuestionType = "TEXT" | "RATING" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE";

interface QuestionBuilder {
  type: QuestionType;
  text: string;
  options: string[]; // Options for choices
  isRequired: boolean;
  newOptionText: string; // Internal temporary input state per question
}

interface SurveyFormData {
  title: string;
  description: string;
  expiresAt: string;
  segmentType:
    | "ENTIRE_SCHOOL"
    | "CLASS"
    | "BATCH"
    | "FEE_DEFAULTERS"
    | "ATTENDANCE_RISK"
    | "PERFORMANCE_RISK";
  classValue: string;
  batchId: string;
  targetAudience: "STUDENTS" | "PARENTS" | "ALL";
  questions: QuestionBuilder[];
}

export default function SurveyBuilder({ batches, classes }: SurveyBuilderProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<SurveyFormData>({
    title: "",
    description: "",
    expiresAt: "",
    segmentType: "ENTIRE_SCHOOL",
    classValue: "",
    batchId: "",
    targetAudience: "ALL",
    questions: [
      {
        type: "RATING",
        text: "How would you rate the general facilities of the school?",
        options: [],
        isRequired: true,
        newOptionText: "",
      },
    ],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddQuestion = (type: QuestionType) => {
    setFormData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          type,
          text: "",
          options: type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE" ? ["Excellent", "Good", "Average"] : [],
          isRequired: true,
          newOptionText: "",
        },
      ],
    }));
  };

  const handleRemoveQuestion = (idx: number) => {
    if (formData.questions.length <= 1) {
      toast.error("A survey must contain at least one question.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, qIdx) => qIdx !== idx),
    }));
  };

  const handleQuestionTextChange = (idx: number, text: string) => {
    setFormData((prev) => {
      const updated = [...prev.questions];
      updated[idx].text = text;
      return { ...prev, questions: updated };
    });
  };

  const handleRequiredToggle = (idx: number) => {
    setFormData((prev) => {
      const updated = [...prev.questions];
      updated[idx].isRequired = !updated[idx].isRequired;
      return { ...prev, questions: updated };
    });
  };

  const handleAddOption = (qIdx: number) => {
    const question = formData.questions[qIdx];
    const optText = question.newOptionText.trim();
    
    if (!optText) return;
    if (question.options.includes(optText)) {
      toast.error("Duplicate option value.");
      return;
    }

    setFormData((prev) => {
      const updated = [...prev.questions];
      updated[qIdx].options = [...updated[qIdx].options, optText];
      updated[qIdx].newOptionText = "";
      return { ...prev, questions: updated };
    });
  };

  const handleRemoveOption = (qIdx: number, optIdx: number) => {
    setFormData((prev) => {
      const updated = [...prev.questions];
      updated[qIdx].options = updated[qIdx].options.filter((_, idx) => idx !== optIdx);
      return { ...prev, questions: updated };
    });
  };

  const handleOptionInputChange = (qIdx: number, text: string) => {
    setFormData((prev) => {
      const updated = [...prev.questions];
      updated[qIdx].newOptionText = text;
      return { ...prev, questions: updated };
    });
  };

  const validate = (): boolean => {
    if (!formData.title.trim()) {
      toast.error("Please provide a survey title");
      return false;
    }

    if (formData.segmentType === "CLASS" && !formData.classValue) {
      toast.error("Please select a target class");
      return false;
    }

    if (formData.segmentType === "BATCH" && !formData.batchId) {
      toast.error("Please select a target batch");
      return false;
    }

    for (let i = 0; i < formData.questions.length; i++) {
      const q = formData.questions[i];
      if (!q.text.trim()) {
        toast.error(`Question ${i + 1} text body is empty`);
        return false;
      }
      if ((q.type === "SINGLE_CHOICE" || q.type === "MULTIPLE_CHOICE") && q.options.length < 2) {
        toast.error(`Question ${i + 1} requires at least 2 selection options`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (shouldPublish: boolean) => {
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      // Create draft survey
      const result = await createSurveyAction({
        title: formData.title,
        description: formData.description || undefined,
        expiresAt: formData.expiresAt || undefined,
        audienceFilter: {
          segmentType: formData.segmentType,
          classValue: formData.classValue || undefined,
          batchId: formData.batchId || undefined,
          targetAudience: formData.targetAudience,
        },
        questions: formData.questions.map((q) => ({
          type: q.type,
          text: q.text,
          options: q.options.length > 0 ? q.options : undefined,
          isRequired: q.isRequired,
        })),
      });

      if (!result?.id) {
        throw new Error("Failed to create survey.");
      }

      if (shouldPublish) {
        await publishSurveyAction(result.id);
        toast.success("Survey published and active for parents!");
      } else {
        toast.success("Survey draft saved successfully!");
      }

      router.push("/dashboard/communications/surveys");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 p-6 md:p-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => router.push("/dashboard/communications/surveys")}
          className="rounded-full bg-white dark:bg-slate-900 border-slate-200"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
            Compose New Survey
          </h1>
          <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
            Publish interactive feedback questionnaires targeted securely to school segments.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Side: General Settings */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shadow-lg rounded-2xl">
            <CardContent className="p-6 space-y-5">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
                Survey Settings
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Survey Title</label>
                <input
                  type="text"
                  placeholder="e.g. Parental Satisfaction Poll 2026"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Description (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Provide details about the purpose of this poll..."
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Expiration Date (Optional)</label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData((prev) => ({ ...prev, expiresAt: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Targeting Segment Rules */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shadow-lg rounded-2xl">
            <CardContent className="p-6 space-y-5">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
                Target Audience Segmentation
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Audience Filter Segment</label>
                <select
                  value={formData.segmentType}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      segmentType: e.target.value as any,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="ENTIRE_SCHOOL">Entire School</option>
                  <option value="CLASS">Class-wise Group</option>
                  <option value="BATCH">Batch-wise Group</option>
                  <option value="FEE_DEFAULTERS">Fee Defaulters Only</option>
                  <option value="ATTENDANCE_RISK">Attendance Risks (&lt;75%)</option>
                  <option value="PERFORMANCE_RISK">Academic Risks (&lt;40%)</option>
                </select>
              </div>

              {formData.segmentType === "CLASS" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Select Target Class</label>
                  <select
                    value={formData.classValue}
                    onChange={(e) => setFormData((prev) => ({ ...prev, classValue: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Choose Class --</option>
                    {classes.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.segmentType === "BATCH" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Select Target Batch</label>
                  <select
                    value={formData.batchId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, batchId: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Choose Batch --</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Target Role Type</label>
                <div className="grid grid-cols-3 gap-2 p-1 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl">
                  {[
                    { role: "ALL" as const, label: "All Users" },
                    { role: "STUDENTS" as const, label: "Students" },
                    { role: "PARENTS" as const, label: "Parents" },
                  ].map((r) => (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, targetAudience: r.role }))}
                      className={`py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 ${
                        formData.targetAudience === r.role
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Questions Editor */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-xl text-slate-800 dark:text-slate-100">Survey Questions</h3>
              <p className="text-xs text-slate-400">Design your questionnaire input list</p>
            </div>

            {/* Quick add panel */}
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                onClick={() => handleAddQuestion("RATING")}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 text-xs flex items-center gap-1"
              >
                <Star className="h-3 w-3 text-amber-500" /> +Rating
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleAddQuestion("SINGLE_CHOICE")}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 text-xs flex items-center gap-1"
              >
                <ListPlus className="h-3 w-3 text-violet-500" /> +Choice
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleAddQuestion("TEXT")}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 text-xs flex items-center gap-1"
              >
                <Type className="h-3 w-3 text-cyan-500" /> +Text
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {formData.questions.map((q, qIdx) => {
              return (
                <Card
                  key={qIdx}
                  className="border border-slate-200 dark:border-slate-800 shadow-md bg-white dark:bg-slate-900 rounded-2xl overflow-hidden relative"
                >
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-violet-600" />
                  
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 px-2.5 py-1 rounded-lg">
                        Q{qIdx + 1}: {q.type}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIdx)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400">Question Text</label>
                      <input
                        type="text"
                        placeholder="e.g. Rate your satisfaction with classroom infrastructure."
                        value={q.text}
                        onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    {/* Options Manager for choice types */}
                    {(q.type === "SINGLE_CHOICE" || q.type === "MULTIPLE_CHOICE") && (
                      <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                        <label className="text-xs font-bold text-slate-400 block">Selection Options</label>
                        
                        {/* Option Chips */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {q.options.map((opt, optIdx) => (
                            <span
                              key={optIdx}
                              className="px-2.5 py-1 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300 flex items-center gap-1.5"
                            >
                              {opt}
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(qIdx, optIdx)}
                                className="text-slate-400 hover:text-red-500 font-extrabold"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>

                        {/* Input to add options */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Add selection option..."
                            value={q.newOptionText}
                            onChange={(e) => handleOptionInputChange(qIdx, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddOption(qIdx);
                              }
                            }}
                            className="flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleAddOption(qIdx)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-1.5 h-auto"
                          >
                            + Add Option
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Question properties */}
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`required-${qIdx}`}
                          checked={q.isRequired}
                          onChange={() => handleRequiredToggle(qIdx)}
                          className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                        <label
                          htmlFor={`required-${qIdx}`}
                          className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer select-none"
                        >
                          Response is Required
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Submission footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-6">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => handleSubmit(false)}
              className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"
            >
              <Save className="h-4 w-4" /> Save as Draft
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(true)}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white flex items-center gap-1.5 shadow-lg shadow-indigo-500/20"
            >
              <Send className="h-4 w-4" /> Publish Survey
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
