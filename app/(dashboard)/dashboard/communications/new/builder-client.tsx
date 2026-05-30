"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Users,
  Layers,
  Clock,
  AlertCircle,
  XCircle,
  CheckCircle,
  Mail,
  Smartphone,
  MessageSquare,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  Send,
  Calendar,
} from "lucide-react";
import { createCampaignAction, queueCampaignAction } from "../actions";
import { toast } from "sonner";

interface Batch {
  id: string;
  name: string;
}

interface CampaignBuilderClientProps {
  batches: Batch[];
  classes: string[];
}

type SegmentType =
  | "ENTIRE_SCHOOL"
  | "CLASS"
  | "BATCH"
  | "FEE_DEFAULTERS"
  | "ATTENDANCE_RISK"
  | "PERFORMANCE_RISK";

interface AudienceFilter {
  segmentType: SegmentType;
  classValue?: string;
  batchId?: string;
  attendanceThreshold: number;
  performanceThreshold: number;
  targetAudience: "STUDENTS" | "PARENTS" | "ALL";
}

interface CampaignFormData {
  name: string;
  subject: string;
  content: string;
  channels: string[];
  audienceFilter: AudienceFilter;
  scheduleType: "NOW" | "SCHEDULED";
  scheduledAt: string;
}

const initialFormData: CampaignFormData = {
  name: "",
  subject: "",
  content: "",
  channels: ["IN_APP"],
  audienceFilter: {
    segmentType: "ENTIRE_SCHOOL",
    classValue: "",
    batchId: "",
    attendanceThreshold: 75,
    performanceThreshold: 40,
    targetAudience: "ALL",
  },
  scheduleType: "NOW",
  scheduledAt: "",
};

const MOCK_DATA = {
  studentName: "Alex Johnson",
  parentName: "Sarah Johnson",
  schoolName: "Greenwood International School",
  className: "Grade 10",
  batchName: "2025-2026 Academic Batch",
  amountDue: "₹1,250.00",
  dueDate: "June 15, 2026",
};

export default function CampaignBuilderClient({ batches, classes }: CampaignBuilderClientProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CampaignFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Helper to replace variables for the preview
  const getHydratedPreview = (text: string) => {
    if (!text) return "Your personalized message preview will appear here...";
    return text
      .replace(/\{\{studentName\}\}/g, MOCK_DATA.studentName)
      .replace(/\{\{parentName\}\}/g, MOCK_DATA.parentName)
      .replace(/\{\{schoolName\}\}/g, MOCK_DATA.schoolName)
      .replace(/\{\{className\}\}/g, MOCK_DATA.className)
      .replace(/\{\{batchName\}\}/g, MOCK_DATA.batchName)
      .replace(/\{\{amountDue\}\}/g, MOCK_DATA.amountDue)
      .replace(/\{\{dueDate\}\}/g, MOCK_DATA.dueDate);
  };

  const handleInsertPlaceholder = (placeholder: string) => {
    const textarea = contentRef.current;
    if (!textarea) {
      setFormData((prev) => ({
        ...prev,
        content: prev.content + ` {{${placeholder}}}`,
      }));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const newContent = `${before}{{${placeholder}}}${after}`;

    setFormData((prev) => ({
      ...prev,
      content: newContent,
    }));

    // Reset cursor position after React update
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + placeholder.length + 4,
        start + placeholder.length + 4
      );
    }, 10);
  };

  const handleChannelToggle = (channel: string) => {
    setFormData((prev) => {
      const channels = prev.channels.includes(channel)
        ? prev.channels.filter((c) => c !== channel)
        : [...prev.channels, channel];
      return { ...prev, channels };
    });
  };

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      const filter = formData.audienceFilter;
      if (filter.segmentType === "CLASS" && !filter.classValue) {
        toast.error("Please select a target class");
        return false;
      }
      if (filter.segmentType === "BATCH" && !filter.batchId) {
        toast.error("Please select a target batch");
        return false;
      }
      return true;
    }

    if (currentStep === 2) {
      if (formData.channels.length === 0) {
        toast.error("Please select at least one delivery channel");
        return false;
      }
      return true;
    }

    if (currentStep === 3) {
      if (!formData.name.trim()) {
        toast.error("Please name your campaign");
        return false;
      }
      if (formData.channels.includes("EMAIL") && !formData.subject.trim()) {
        toast.error("Please provide an email subject line");
        return false;
      }
      if (!formData.content.trim()) {
        toast.error("Please enter your campaign message body");
        return false;
      }
      return true;
    }

    if (currentStep === 4) {
      if (formData.scheduleType === "SCHEDULED" && !formData.scheduledAt) {
        toast.error("Please select a scheduled date and time");
        return false;
      }
      return true;
    }

    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (shouldQueue: boolean) => {
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    try {
      // 1. Create campaign draft
      const result = await createCampaignAction({
        name: formData.name,
        subject: formData.subject || undefined,
        content: formData.content,
        channels: formData.channels,
        audienceFilter: {
          segmentType: formData.audienceFilter.segmentType,
          classValue: formData.audienceFilter.classValue || undefined,
          batchId: formData.audienceFilter.batchId || undefined,
          attendanceThreshold: Number(formData.audienceFilter.attendanceThreshold),
          performanceThreshold: Number(formData.audienceFilter.performanceThreshold),
          targetAudience: formData.audienceFilter.targetAudience,
        },
      });

      if (!result?.id) {
        throw new Error("Failed to create campaign record.");
      }

      // 2. Queue if requested
      if (shouldQueue) {
        await queueCampaignAction(result.id);
        toast.success("Campaign queued and processing started!");
      } else {
        toast.success("Campaign draft saved successfully!");
      }

      router.push("/dashboard/communications");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 p-6 md:p-10 max-w-5xl mx-auto">
      {/* Dynamic Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Create Communication Campaign
        </h1>
        <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
          Build a production-grade segmented broadcast across secure multi-tenant channels.
        </p>
      </div>

      {/* Modern High-End Wizard Step Progress Bar */}
      <div className="relative flex items-center justify-between w-full border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0 mx-16 hidden md:block" />
        
        {/* Dynamic active line mapping */}
        <div
          className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 -translate-y-1/2 z-0 mx-16 transition-all duration-300 hidden md:block"
          style={{ width: `${((step - 1) / 3) * 80}%` }}
        />

        {[
          { label: "Target Audience", icon: Users },
          { label: "Delivery Channels", icon: Megaphone },
          { label: "Compose Message", icon: Mail },
          { label: "Review & Schedule", icon: Calendar },
        ].map((s, idx) => {
          const Icon = s.icon;
          const stepNumber = idx + 1;
          const isActive = step === stepNumber;
          const isCompleted = step > stepNumber;

          return (
            <div key={idx} className="flex flex-col items-center z-10 space-y-2 relative flex-1 md:flex-initial">
              <div
                className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-950/40 scale-110 shadow-lg shadow-indigo-500/20"
                    : isCompleted
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/10"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                }`}
              >
                {isCompleted ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              <span
                className={`text-xs font-bold text-center tracking-tight transition-colors duration-300 ${
                  isActive ? "text-indigo-600 dark:text-indigo-400 font-extrabold" : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Main Content Area */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shadow-xl">
        <CardContent className="p-8">
          {/* STEP 1: AUDIENCE SELECTOR */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Step 1: Choose Recipient Segment</h3>
                <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
                  Select the demographic layer of your school to broadcast this message to.
                </p>
              </div>

              {/* Glowing Card Grid Selectors */}
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  {
                    type: "ENTIRE_SCHOOL" as SegmentType,
                    title: "Entire School",
                    desc: "Broadcast to all students and parent users in the system.",
                    icon: Users,
                    color: "indigo",
                  },
                  {
                    type: "CLASS" as SegmentType,
                    title: "Class Group",
                    desc: "Select a specific academic class standard (e.g. Grade 10).",
                    icon: Layers,
                    color: "purple",
                  },
                  {
                    type: "BATCH" as SegmentType,
                    title: "Batch Group",
                    desc: "Send to a specific academic batch or fee group.",
                    icon: Clock,
                    color: "emerald",
                  },
                  {
                    type: "FEE_DEFAULTERS" as SegmentType,
                    title: "Fee Defaulters",
                    desc: "Identify parents with outstanding overdue invoice balances.",
                    icon: AlertCircle,
                    color: "red",
                  },
                  {
                    type: "ATTENDANCE_RISK" as SegmentType,
                    title: "Attendance Risk",
                    desc: "Target students/parents with attendance below threshold warnings.",
                    icon: XCircle,
                    color: "amber",
                  },
                  {
                    type: "PERFORMANCE_RISK" as SegmentType,
                    title: "Performance Warning",
                    desc: "Target students with academic exam performance risks.",
                    icon: CheckCircle,
                    color: "pink",
                  },
                ].map((seg) => {
                  const Icon = seg.icon;
                  const isSelected = formData.audienceFilter.segmentType === seg.type;

                  return (
                    <button
                      key={seg.type}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          audienceFilter: {
                            ...prev.audienceFilter,
                            segmentType: seg.type,
                          },
                        }))
                      }
                      className={`text-left p-5 rounded-2xl border transition-all duration-300 relative group flex flex-col justify-between ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/20 dark:border-indigo-500 dark:bg-indigo-950/10 shadow-lg shadow-indigo-500/5 ring-2 ring-indigo-500/20"
                          : "border-slate-200 bg-white/50 dark:border-slate-800 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="space-y-3">
                        <div
                          className={`p-3 rounded-xl w-fit transition-colors duration-300 ${
                            isSelected
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-slate-700"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-200">{seg.title}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{seg.desc}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Conditional Segment Options */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
                {formData.audienceFilter.segmentType === "CLASS" && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Select Academic Class</label>
                    <select
                      value={formData.audienceFilter.classValue}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          audienceFilter: {
                            ...prev.audienceFilter,
                            classValue: e.target.value,
                          },
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="">-- Choose Class --</option>
                      {classes.map((cls) => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.audienceFilter.segmentType === "BATCH" && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Select Batch Group</label>
                    <select
                      value={formData.audienceFilter.batchId}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          audienceFilter: {
                            ...prev.audienceFilter,
                            batchId: e.target.value,
                          },
                        }))
                      }
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

                {formData.audienceFilter.segmentType === "ATTENDANCE_RISK" && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Attendance Warning Threshold (%)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.audienceFilter.attendanceThreshold}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          audienceFilter: {
                            ...prev.audienceFilter,
                            attendanceThreshold: Number(e.target.value),
                          },
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                    <p className="text-xs text-slate-400">
                      Identify students with an aggregate attendance percentage lower than this threshold.
                    </p>
                  </div>
                )}

                {formData.audienceFilter.segmentType === "PERFORMANCE_RISK" && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Academic Risk Performance Threshold (%)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.audienceFilter.performanceThreshold}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          audienceFilter: {
                            ...prev.audienceFilter,
                            performanceThreshold: Number(e.target.value),
                          },
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                    <p className="text-xs text-slate-400">
                      Target students with cumulative academic results scoring below this threshold.
                    </p>
                  </div>
                )}

                {/* Target Audience: Students, Parents, Both */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Target Role Audience</label>
                  <div className="grid grid-cols-3 gap-2 p-1.5 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl max-w-md">
                    {[
                      { role: "STUDENTS" as const, label: "Students Only" },
                      { role: "PARENTS" as const, label: "Parents Only" },
                      { role: "ALL" as const, label: "All Users" },
                    ].map((btn) => (
                      <button
                        key={btn.role}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            audienceFilter: {
                              ...prev.audienceFilter,
                              targetAudience: btn.role,
                            },
                          }))
                        }
                        className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all duration-300 ${
                          formData.audienceFilter.targetAudience === btn.role
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:dark:text-slate-200"
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CHANNELS */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Step 2: Choose Delivery Channels</h3>
                <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
                  Select which platforms/channels this campaign is sent across. System honors active recipient user notification preferences automatically.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {[
                  {
                    channel: "IN_APP",
                    title: "In-App Notification Feed",
                    desc: "Post directly to the recipient's secure SchoolPay In-App dashboard alerts feed.",
                    icon: Megaphone,
                    badge: "Free & Instant",
                  },
                  {
                    channel: "EMAIL",
                    title: "Email Broadcast",
                    desc: "Deliver personalized rich messages straight to the verified institutional email address.",
                    icon: Mail,
                    badge: "Highly Configurable",
                  },
                  {
                    channel: "SMS",
                    title: "Transactional SMS",
                    desc: "Broadcast instant mobile alerts directly to their verified cellular numbers.",
                    icon: Smartphone,
                    badge: "High Open Rate",
                  },
                  {
                    channel: "WHATSAPP",
                    title: "WhatsApp Messenger API",
                    desc: "Reach users instantly on their favorite personal conversational messaging channel.",
                    icon: MessageSquare,
                    badge: "Modern Engagement",
                  },
                ].map((ch) => {
                  const Icon = ch.icon;
                  const isChecked = formData.channels.includes(ch.channel);

                  return (
                    <button
                      key={ch.channel}
                      type="button"
                      onClick={() => handleChannelToggle(ch.channel)}
                      className={`text-left p-6 rounded-2xl border transition-all duration-300 flex items-start gap-4 ${
                        isChecked
                          ? "border-indigo-600 bg-indigo-50/20 dark:border-indigo-500 dark:bg-indigo-950/10 shadow-lg shadow-indigo-500/5 ring-2 ring-indigo-500/20"
                          : "border-slate-200 bg-white/50 dark:border-slate-800 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div
                        className={`p-3 rounded-xl transition-colors duration-300 ${
                          isChecked
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{ch.title}</span>
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            {ch.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{ch.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: CONTENT COMPOSITION & PREVIEW */}
          {step === 3 && (
            <div className="grid gap-8 lg:grid-cols-12">
              {/* Form Input Columns */}
              <div className="space-y-5 lg:col-span-7">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Step 3: Compose Campaign Template</h3>
                  <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
                    Provide internal descriptions, template subjects, and dynamic body texts.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Campaign Campaign Name</label>
                    <input
                      type="text"
                      placeholder="e.g. June Monthly Fee Overdue Reminder"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-400">Internal name to easily track analytics and performance logs.</p>
                  </div>

                  {formData.channels.includes("EMAIL") && (
                    <div className="space-y-1">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Email Subject Line</label>
                      <input
                        type="text"
                        placeholder="e.g. ACTION REQUIRED: Pending Fee Invoices for {{studentName}}"
                        value={formData.subject}
                        onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                      />
                      <p className="text-[11px] text-slate-400">Placeholders are evaluated in email subjects too!</p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Message Content Body</label>
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">Supports Dynamic Merging</span>
                    </div>

                    {/* Cursor interactive placeholders injector bar */}
                    <div className="flex items-center gap-1.5 flex-wrap p-2 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl mb-1 text-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 select-none">Placeholders:</span>
                      {[
                        { token: "studentName", label: "Student Name" },
                        { token: "parentName", label: "Parent Name" },
                        { token: "schoolName", label: "School Name" },
                        { token: "className", label: "Class" },
                        { token: "batchName", label: "Batch" },
                        { token: "amountDue", label: "Amount Due" },
                        { token: "dueDate", label: "Due Date" },
                      ].map((t) => (
                        <button
                          key={t.token}
                          type="button"
                          onClick={() => handleInsertPlaceholder(t.token)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 hover:text-slate-900 transition-colors font-medium dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 shadow-sm"
                        >
                          +{t.label}
                        </button>
                      ))}
                    </div>

                    <textarea
                      ref={contentRef}
                      rows={8}
                      placeholder="Type your announcement campaign template here... Use tags like {{studentName}} and {{amountDue}}."
                      value={formData.content}
                      onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none resize-y"
                    />
                  </div>
                </div>
              </div>

              {/* Premium Preview Column */}
              <div className="lg:col-span-5 flex flex-col justify-start space-y-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Live Personalization Preview</h4>
                  <p className="text-xs text-slate-400">Displays real-time hydrated mockup values.</p>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 rounded-2xl overflow-hidden shadow-inner flex flex-col h-full min-h-[300px]">
                  {/* Glassmorphic Preview Window Header */}
                  <div className="border-b border-slate-200 dark:border-slate-800 px-4 py-3 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-red-400 rounded-full" />
                      <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full" />
                      <span className="w-2.5 h-2.5 bg-green-400 rounded-full" />
                    </div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Preview Feed</span>
                  </div>

                  {/* Body Preview Details */}
                  <div className="p-6 flex-1 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      {formData.channels.includes("EMAIL") && (
                        <div className="text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
                          <span className="font-bold text-slate-400 mr-2">Subject:</span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {formData.subject ? getHydratedPreview(formData.subject) : "(No subject specified)"}
                          </span>
                        </div>
                      )}
                      
                      <div className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed font-sans min-h-[120px]">
                        {getHydratedPreview(formData.content)}
                      </div>
                    </div>

                    {/* Metadata indicators */}
                    <div className="text-[10px] border-t border-slate-100 dark:border-slate-800 pt-3 flex flex-wrap items-center justify-between text-slate-400 font-semibold gap-2">
                      <span>Recipients: {formData.audienceFilter.targetAudience}</span>
                      <span>Targeting Channels: {formData.channels.join(", ")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & SCHEDULE */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Step 4: Finalize Campaign Scheduling</h3>
                <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
                  Choose when to deliver your communication campaign and double check your configurations.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-12">
                {/* Details Summary column */}
                <div className="md:col-span-7 space-y-5">
                  <div className="border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl p-6 space-y-4">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
                      Campaign Summary
                    </h4>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-xs text-slate-400 block font-bold uppercase">Campaign Name</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{formData.name}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block font-bold uppercase">Target Segment</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300 uppercase">
                          {formData.audienceFilter.segmentType.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block font-bold uppercase">Delivery Target</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300 uppercase">
                          {formData.audienceFilter.targetAudience === "ALL" ? "Students & Parents" : formData.audienceFilter.targetAudience}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block font-bold uppercase">Active Channels</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{formData.channels.join(", ")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Scheduling Selection Options */}
                  <div className="space-y-4">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">Deliver Mode</label>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        {
                          type: "NOW" as const,
                          title: "Send Now",
                          desc: "Submit and process right away.",
                          icon: Send,
                        },
                        {
                          type: "SCHEDULED" as const,
                          title: "Scheduled Broadcast",
                          desc: "Set a future date for execution.",
                          icon: Calendar,
                        },
                      ].map((s) => {
                        const Icon = s.icon;
                        const isSelected = formData.scheduleType === s.type;

                        return (
                          <button
                            key={s.type}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                scheduleType: s.type,
                              }))
                            }
                            className={`text-left p-4 rounded-xl border transition-all duration-300 flex items-center gap-3 ${
                              isSelected
                                ? "border-indigo-600 bg-indigo-50/20 dark:border-indigo-500 dark:bg-indigo-950/10"
                                : "border-slate-200 bg-white/50 dark:border-slate-800 dark:bg-slate-900/50"
                            }`}
                          >
                            <div
                              className={`p-2 rounded-lg ${
                                isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <h5 className="font-bold text-sm text-slate-800 dark:text-slate-200">{s.title}</h5>
                              <p className="text-[10px] text-slate-400">{s.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {formData.scheduleType === "SCHEDULED" && (
                      <div className="space-y-2 animate-fadeIn">
                        <label className="text-xs font-bold text-slate-500 uppercase block">Scheduled Date & Time</label>
                        <input
                          type="datetime-local"
                          value={formData.scheduledAt}
                          onChange={(e) => setFormData((prev) => ({ ...prev, scheduledAt: e.target.value }))}
                          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none w-full"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Confirm instructions column */}
                <div className="md:col-span-5">
                  <div className="border border-indigo-100 dark:border-indigo-950/40 bg-indigo-50/10 dark:bg-indigo-950/5 rounded-2xl p-6 space-y-4">
                    <h4 className="font-bold text-indigo-700 dark:text-indigo-400">Important Notices</h4>
                    <ul className="list-disc list-inside text-xs text-slate-500 space-y-2 dark:text-slate-400 leading-relaxed">
                      <li>Communications respect user settings and preference filters automatically.</li>
                      <li>To safeguard performance, mass emissions process sequentially in batches of 100 via task runners.</li>
                      <li>All executions create audit records locked strictly within school isolation bounds.</li>
                      <li>Double check placeholders to ensure correct evaluation during queue times.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Wizard Controls Footer */}
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-6 mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={step === 1 || isSubmitting}
              className="flex items-center gap-1 border-slate-200 hover:bg-slate-50 text-slate-600"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>

            <div className="flex items-center gap-3">
              {/* Draft option always available after stepping past composing */}
              {step >= 3 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting}
                  className="border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                >
                  Save as Draft
                </Button>
              )}

              {step < 4 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 shadow-lg shadow-indigo-500/10"
                >
                  Continue <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => handleSubmit(formData.scheduleType === "NOW")}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white flex items-center gap-1.5 shadow-lg shadow-indigo-500/20"
                >
                  {isSubmitting ? (
                    "Processing..."
                  ) : formData.scheduleType === "NOW" ? (
                    <>
                      <Send className="h-4 w-4" /> Queue & Broadcast
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4" /> Schedule Campaign
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
