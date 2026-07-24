"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, Mail, MessageSquare, Send, Smartphone } from "lucide-react";
import { RichContentEditor } from "./RichContentEditor";
import { AudienceSelector } from "./AudienceSelector";
import { createCampaignAction, queueCampaignAction } from "@/app/(dashboard)/dashboard/communications/actions";

interface CampaignData {
  name: string;
  subject: string;
  channels: string[];
  audience: {
    type: string;
    classes: string[];
    batches: string[];
  };
  content: string;
}

const INITIAL_DATA: CampaignData = {
  name: "",
  subject: "",
  channels: ["EMAIL"],
  audience: { type: "ALL_STUDENTS", classes: [], batches: [] },
  content: "",
};

export function CampaignWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<CampaignData>(INITIAL_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateData = (fields: Partial<CampaignData>) => {
    setData((prev) => ({ ...prev, ...fields }));
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!data.name.trim()) return toast.error("Campaign name is required");
      if (data.channels.length === 0) return toast.error("Select at least one channel");
      if (data.channels.includes("EMAIL") && !data.subject.trim()) {
        return toast.error("Email campaigns require a subject");
      }
    }
    if (currentStep === 2) {
      if (data.audience.type === "SPECIFIC_CLASSES" && data.audience.classes.length === 0) {
        return toast.error("Select at least one class");
      }
      if (data.audience.type === "SPECIFIC_BATCHES" && data.audience.batches.length === 0) {
        return toast.error("Select at least one batch");
      }
    }
    if (currentStep === 3) {
      if (!data.content || data.content === "<p></p>") {
        return toast.error("Campaign content cannot be empty");
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleSave = async (queue: boolean = false) => {
    setIsSubmitting(true);
    try {
      const res = await createCampaignAction({
        name: data.name,
        subject: data.subject || undefined,
        content: data.content,
        channels: data.channels,
        audienceFilter: data.audience,
      });

      if ("error" in res) {
        throw new Error(String(res.error));
      }

      if (queue && res?.id) {
        const queueRes = await queueCampaignAction(res.id);
        if ("error" in queueRes) throw new Error(String(queueRes.error));
        toast.success("Campaign queued for dispatch successfully!");
      } else {
        toast.success("Campaign saved as draft!");
      }

      router.push("/dashboard/communications");
    } catch (e: any) {
      toast.error(e.message || "Failed to save campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = ["Setup", "Audience", "Content", "Review"];
    return (
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-white/10 z-0"></div>
        {steps.map((label, i) => {
          const stepNum = i + 1;
          const isActive = currentStep === stepNum;
          const isCompleted = currentStep > stepNum;
          return (
            <div key={label} className="relative z-10 flex flex-col items-center gap-2 bg-[#0F172A] px-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isActive
                    ? "border-indigo-500 bg-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                    : isCompleted
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-white/20 bg-white/5 text-white/50"
                }`}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : stepNum}
              </div>
              <span className={`text-xs font-medium ${isActive ? "text-indigo-400" : isCompleted ? "text-emerald-400" : "text-white/50"}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
      {renderStepIndicator()}

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl min-h-[400px]">
        
        {/* STEP 1: SETUP */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Campaign Setup</h2>
              <p className="text-white/60 text-sm">Name your campaign and choose your delivery channels.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Campaign Name</label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => updateData({ name: e.target.value })}
                  placeholder="e.g., Q3 Fee Reminder"
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-3">Delivery Channels</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div
                    onClick={() => {
                      const newChannels = data.channels.includes("EMAIL")
                        ? data.channels.filter(c => c !== "EMAIL")
                        : [...data.channels, "EMAIL"];
                      updateData({ channels: newChannels });
                    }}
                    className={`p-4 rounded-xl border cursor-pointer flex flex-col items-center justify-center gap-2 transition-all ${
                      data.channels.includes("EMAIL")
                        ? "bg-indigo-500/20 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <Mail className={`w-8 h-8 ${data.channels.includes("EMAIL") ? "text-indigo-400" : "text-white/50"}`} />
                    <span className={`font-medium ${data.channels.includes("EMAIL") ? "text-indigo-300" : "text-white/70"}`}>Email</span>
                  </div>

                  {/* SMS - Disabled Explicitly */}
                  <div className="p-4 rounded-xl border border-white/5 bg-white/5 opacity-50 cursor-not-allowed flex flex-col items-center justify-center gap-2 relative overflow-hidden group">
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                      Coming Soon
                    </div>
                    <MessageSquare className="w-8 h-8 text-white/30" />
                    <span className="font-medium text-white/50">SMS</span>
                  </div>

                  {/* WhatsApp - Disabled Explicitly */}
                  <div className="p-4 rounded-xl border border-white/5 bg-white/5 opacity-50 cursor-not-allowed flex flex-col items-center justify-center gap-2 relative overflow-hidden">
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                      Coming Soon
                    </div>
                    <Smartphone className="w-8 h-8 text-white/30" />
                    <span className="font-medium text-white/50">WhatsApp</span>
                  </div>
                </div>
                {data.channels.length === 0 && <p className="text-red-400 text-xs mt-2">At least one active channel must be selected.</p>}
              </div>

              {data.channels.includes("EMAIL") && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-medium text-white/80 mb-1">Email Subject</label>
                  <input
                    type="text"
                    value={data.subject}
                    onChange={(e) => updateData({ subject: e.target.value })}
                    placeholder="Subject line for your email..."
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: AUDIENCE */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
             <div>
              <h2 className="text-xl font-bold text-white mb-1">Target Audience</h2>
              <p className="text-white/60 text-sm">Select who should receive this campaign.</p>
            </div>
            <AudienceSelector 
              value={data.audience} 
              onChange={(audience) => updateData({ audience })} 
            />
          </div>
        )}

        {/* STEP 3: CONTENT */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Campaign Content</h2>
              <p className="text-white/60 text-sm">Compose your message. Use variables like {'{{name}}'} to personalize.</p>
            </div>
            
            <RichContentEditor
              value={data.content}
              onChange={(content) => updateData({ content })}
            />
          </div>
        )}

        {/* STEP 4: REVIEW */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
             <div>
              <h2 className="text-xl font-bold text-white mb-1">Review & Dispatch</h2>
              <p className="text-white/60 text-sm">Verify your settings before sending.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 bg-black/20 p-5 rounded-xl border border-white/5">
                <h3 className="text-white font-medium flex items-center gap-2 border-b border-white/10 pb-2">
                  <Mail className="w-4 h-4 text-indigo-400" />
                  Campaign Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-white/50">Name:</span> <span className="text-white">{data.name}</span></div>
                  <div className="flex justify-between"><span className="text-white/50">Channels:</span> <span className="text-white">{data.channels.join(", ")}</span></div>
                  {data.subject && <div className="flex justify-between"><span className="text-white/50">Subject:</span> <span className="text-white">{data.subject}</span></div>}
                </div>
              </div>

              <div className="space-y-4 bg-black/20 p-5 rounded-xl border border-white/5">
                <h3 className="text-white font-medium flex items-center gap-2 border-b border-white/10 pb-2">
                  <Send className="w-4 h-4 text-emerald-400" />
                  Audience Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-white/50">Target:</span> <span className="text-white">{data.audience.type.replace("_", " ")}</span></div>
                  {data.audience.classes.length > 0 && <div className="flex justify-between"><span className="text-white/50">Classes:</span> <span className="text-white">{data.audience.classes.join(", ")}</span></div>}
                  {data.audience.batches.length > 0 && <div className="flex justify-between"><span className="text-white/50">Batches:</span> <span className="text-white">{data.audience.batches.length} selected</span></div>}
                </div>
              </div>
            </div>

            <div className="bg-black/20 p-5 rounded-xl border border-white/5 space-y-3">
              <h3 className="text-white font-medium text-sm border-b border-white/10 pb-2">Message Preview (Raw HTML)</h3>
              <div className="text-white/70 text-sm max-h-32 overflow-y-auto prose prose-invert">
                <div dangerouslySetInnerHTML={{ __html: data.content }} />
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Navigation Footer */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 1 || isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        
        {currentStep < 4 ? (
          <button
            onClick={nextStep}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => handleSave(false)}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save as Draft
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? "Processing..." : "Queue Campaign"} <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
