"use client"

import React, { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Users,
  Clock,
  AlertCircle,
  XCircle,
  CheckCircle,
  Mail,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Send,
  Calendar,
  Layers,
  Megaphone
} from "lucide-react"
import { createCampaignAction, queueCampaignAction } from "../actions"
import { toast } from "sonner"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

interface Batch {
  id: string
  name: string
}

interface CampaignBuilderClientProps {
  batches: Batch[]
  classes: string[]
}

type SegmentType = "ENTIRE_SCHOOL" | "CLASS" | "BATCH" | "FEE_DEFAULTERS" | "ATTENDANCE_RISK" | "PERFORMANCE_RISK"

interface AudienceFilter {
  segmentType: SegmentType
  classValue?: string
  batchId?: string
  targetAudience: "STUDENTS" | "PARENTS" | "ALL"
}

export default function CampaignBuilderClient({ batches, classes }: CampaignBuilderClientProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const smsRef = useRef<HTMLTextAreaElement>(null)

  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    emailContent: "",
    smsContent: "",
    channels: ["EMAIL", "SMS"], // Default channels
    audienceFilter: {
      segmentType: "ENTIRE_SCHOOL" as SegmentType,
      classValue: "",
      batchId: "",
      targetAudience: "ALL" as const,
    },
    scheduleType: "NOW" as "NOW" | "SCHEDULED",
    scheduledAt: "",
  })

  // Calculations for SMS estimation
  const smsCharCount = formData.smsContent.length
  const smsSegments = Math.max(1, Math.ceil(smsCharCount / 160))
  // Dummy recipient count based on segment for preview purposes
  const estimatedRecipients = formData.audienceFilter.segmentType === "ENTIRE_SCHOOL" ? 1250 : 45
  const estimatedCost = (smsSegments * estimatedRecipients * 0.15).toFixed(2)

  const handleChannelToggle = (channel: string) => {
    setFormData((prev) => {
      const channels = prev.channels.includes(channel)
        ? prev.channels.filter((c) => c !== channel)
        : [...prev.channels, channel]
      return { ...prev, channels }
    })
  }

  const handleInsertPlaceholder = (placeholder: string, target: 'email' | 'sms') => {
    if (target === 'sms') {
      const textarea = smsRef.current
      if (!textarea) return
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = textarea.value
      const before = text.substring(0, start)
      const after = text.substring(end, text.length)
      const newContent = `${before}{{${placeholder}}}${after}`

      setFormData((prev) => ({ ...prev, smsContent: newContent }))
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + placeholder.length + 4, start + placeholder.length + 4)
      }, 10)
    } else {
      // For TipTap Email Editor, we just append for now to keep it simple, or user can type it.
      setFormData((prev) => ({ ...prev, emailContent: prev.emailContent + ` {{${placeholder}}} ` }))
    }
  }

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (formData.channels.length === 0) {
        toast.error("Please select at least one delivery channel")
        return false
      }
      if (formData.scheduleType === "SCHEDULED" && !formData.scheduledAt) {
        toast.error("Please select a scheduled date and time")
        return false
      }
      return true
    }
    if (currentStep === 2) {
      if (!formData.name.trim()) {
        toast.error("Please name your campaign")
        return false
      }
      if (formData.channels.includes("EMAIL") && (!formData.subject.trim() || !formData.emailContent.trim())) {
        toast.error("Please provide Email subject and content")
        return false
      }
      if (formData.channels.includes("SMS") && !formData.smsContent.trim()) {
        toast.error("Please provide SMS content")
        return false
      }
      return true
    }
    return true
  }

  const nextStep = () => {
    if (validateStep(step)) setStep((prev) => Math.min(prev + 1, 3))
  }

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1))

  const handleSubmit = async (shouldQueue: boolean) => {
    if (!validateStep(3)) return
    setIsSubmitting(true)

    try {
      // Store both contents as JSON in the database content text field
      const combinedContent = JSON.stringify({
        email: formData.emailContent,
        sms: formData.smsContent,
      })

      const result = await createCampaignAction({
        name: formData.name,
        subject: formData.subject || undefined,
        content: combinedContent,
        channels: formData.channels,
        audienceFilter: formData.audienceFilter,
      })

      if (!result?.id) throw new Error("Failed to create campaign record.")

      if (shouldQueue) {
        await queueCampaignAction(result.id)
        toast.success("Campaign queued and processing started!")
      } else {
        toast.success("Campaign draft saved successfully!")
      }

      router.push("/dashboard/communications")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 p-6 md:p-10 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Message Creation Wizard
        </h1>
        <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
          Build multi-channel broadcast messages with targeted audience segments.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="relative flex items-center justify-between w-full border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-6 rounded-2xl">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0 mx-16 hidden md:block" />
        <div
          className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 -translate-y-1/2 z-0 mx-16 transition-all duration-300 hidden md:block"
          style={{ width: `${((step - 1) / 2) * 80}%` }}
        />
        {[
          { label: "Configuration", icon: Users },
          { label: "Composer", icon: Mail },
          { label: "Review & Send", icon: CheckCircle },
        ].map((s, idx) => {
          const Icon = s.icon
          const stepNumber = idx + 1
          const isActive = step === stepNumber
          const isCompleted = step > stepNumber

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
              <span className={`text-xs font-bold text-center tracking-tight ${isActive ? "text-indigo-600 dark:text-indigo-400 font-extrabold" : "text-slate-500 dark:text-slate-400"}`}>
                {s.label}
              </span>
            </div>
          )
        })}
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shadow-xl">
        <CardContent className="p-8">
          
          {/* STEP 1: CONFIGURATION */}
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
              {/* Audience Targeting */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">1. Select Target Audience</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { type: "ENTIRE_SCHOOL" as const, title: "All Parents & Students", icon: Users },
                    { type: "CLASS" as const, title: "Specific Class", icon: Layers },
                    { type: "BATCH" as const, title: "Specific Batch", icon: Clock },
                  ].map((seg) => (
                    <button
                      key={seg.type}
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, audienceFilter: { ...p.audienceFilter, segmentType: seg.type } }))}
                      className={`text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-3 ${
                        formData.audienceFilter.segmentType === seg.type
                          ? "border-indigo-600 bg-indigo-50/20 dark:border-indigo-500 dark:bg-indigo-950/10 shadow-sm"
                          : "border-slate-200 bg-white/50 dark:border-slate-800 dark:bg-slate-900/50 hover:border-slate-300"
                      }`}
                    >
                      <seg.icon className="h-5 w-5" />
                      <span className="font-semibold text-sm">{seg.title}</span>
                    </button>
                  ))}
                </div>

                {formData.audienceFilter.segmentType === "CLASS" && (
                  <select
                    value={formData.audienceFilter.classValue}
                    onChange={(e) => setFormData(p => ({ ...p, audienceFilter: { ...p.audienceFilter, classValue: e.target.value } }))}
                    className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Choose Class --</option>
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                )}
                {formData.audienceFilter.segmentType === "BATCH" && (
                  <select
                    value={formData.audienceFilter.batchId}
                    onChange={(e) => setFormData(p => ({ ...p, audienceFilter: { ...p.audienceFilter, batchId: e.target.value } }))}
                    className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Choose Batch --</option>
                    {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                )}
              </div>

              {/* Channels */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">2. Select Channels</h3>
                <div className="flex gap-4">
                  {[
                    { id: "EMAIL", label: "Email", icon: Mail },
                    { id: "SMS", label: "SMS", icon: Smartphone },
                    { id: "IN_APP", label: "In-App Notification", icon: Megaphone }
                  ].map(ch => (
                    <div key={ch.id} className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 pr-6">
                      <Switch 
                        checked={formData.channels.includes(ch.id)} 
                        onCheckedChange={() => handleChannelToggle(ch.id)} 
                        id={`ch-${ch.id}`}
                      />
                      <Label htmlFor={`ch-${ch.id}`} className="flex items-center gap-2 cursor-pointer">
                        <ch.icon className="w-4 h-4 text-slate-500" />
                        {ch.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Schedule */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">3. Delivery Schedule</h3>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, scheduleType: "NOW" }))}
                    className={`px-6 py-3 rounded-xl border font-semibold text-sm transition-colors ${formData.scheduleType === "NOW" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600"}`}
                  >
                    Send Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, scheduleType: "SCHEDULED" }))}
                    className={`px-6 py-3 rounded-xl border font-semibold text-sm transition-colors ${formData.scheduleType === "SCHEDULED" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600"}`}
                  >
                    Schedule for Later
                  </button>
                </div>
                {formData.scheduleType === "SCHEDULED" && (
                  <input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData(p => ({ ...p, scheduledAt: e.target.value }))}
                    className="max-w-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none w-full"
                  />
                )}
              </div>
            </div>
          )}

          {/* STEP 2: COMPOSER */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div>
                <Label className="text-lg font-bold">Campaign Name</Label>
                <input
                  type="text"
                  placeholder="e.g. Exam Schedule Announcement"
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="w-full mt-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {formData.channels.includes("EMAIL") && (
                <div className="space-y-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    <Mail className="h-5 w-5" />
                    <h3 className="font-bold text-lg">Email Composer</h3>
                  </div>
                  <div>
                    <Label className="font-semibold text-slate-700 dark:text-slate-300">Subject Line</Label>
                    <input
                      type="text"
                      placeholder="Enter email subject"
                      value={formData.subject}
                      onChange={(e) => setFormData(p => ({ ...p, subject: e.target.value }))}
                      className="w-full mt-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-semibold text-slate-700 dark:text-slate-300">Body</Label>
                      <div className="flex gap-2 text-xs">
                        {["student_name", "fee_due"].map((tag) => (
                          <button key={tag} type="button" onClick={() => handleInsertPlaceholder(tag, "email")} className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300">
                            + {`{{${tag}}}`}
                          </button>
                        ))}
                      </div>
                    </div>
                    <RichTextEditor value={formData.emailContent} onChange={(val) => setFormData(p => ({ ...p, emailContent: val }))} />
                  </div>
                </div>
              )}

              {formData.channels.includes("SMS") && (
                <div className="space-y-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <Smartphone className="h-5 w-5" />
                    <h3 className="font-bold text-lg">SMS Composer</h3>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-semibold text-slate-700 dark:text-slate-300">Message</Label>
                      <div className="flex gap-2 text-xs">
                        {["student_name", "fee_due"].map((tag) => (
                          <button key={tag} type="button" onClick={() => handleInsertPlaceholder(tag, "sms")} className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300">
                            + {`{{${tag}}}`}
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      ref={smsRef}
                      rows={4}
                      value={formData.smsContent}
                      onChange={(e) => setFormData(p => ({ ...p, smsContent: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none resize-none"
                      placeholder="Type your SMS here..."
                    />
                    <div className="flex justify-between items-center mt-2 text-xs text-slate-500 font-medium">
                      <span>{smsCharCount} chars ({smsSegments} segment{smsSegments !== 1 && 's'})</span>
                      <span className="flex items-center gap-1">
                        Est. Cost per user: <span className="text-slate-800 dark:text-slate-200 font-bold">₹{(smsSegments * 0.15).toFixed(2)}</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: PREVIEW & CONFIRM */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Review & Confirm</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 border-b pb-2">Campaign Details</h4>
                  <div className="grid grid-cols-2 gap-y-4 text-sm">
                    <div>
                      <span className="text-slate-500 block text-xs font-bold uppercase mb-1">Name</span>
                      <span className="font-semibold">{formData.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs font-bold uppercase mb-1">Target</span>
                      <span className="font-semibold">{formData.audienceFilter.segmentType.replace("_", " ")}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs font-bold uppercase mb-1">Channels</span>
                      <div className="flex gap-1 flex-wrap">
                        {formData.channels.map(c => (
                          <span key={c} className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-xs font-semibold">{c}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs font-bold uppercase mb-1">Schedule</span>
                      <span className="font-semibold">{formData.scheduleType === "NOW" ? "Immediate" : new Date(formData.scheduledAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-950/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 space-y-4">
                  <h4 className="font-bold text-indigo-800 dark:text-indigo-300 border-b border-indigo-200 dark:border-indigo-800/50 pb-2">Cost Estimation & Reach</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium">Estimated Recipients:</span>
                      <span className="font-bold">{estimatedRecipients}</span>
                    </div>
                    {formData.channels.includes("SMS") && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-indigo-600 dark:text-indigo-400 font-medium">SMS Segments:</span>
                          <span className="font-bold">{smsSegments} per recipient</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-indigo-200 dark:border-indigo-800/50 text-base">
                          <span className="text-indigo-800 dark:text-indigo-300 font-bold">Estimated SMS Cost:</span>
                          <span className="font-black text-rose-600 dark:text-rose-400">₹{estimatedCost}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-6 mt-8">
            <Button variant="outline" onClick={prevStep} disabled={step === 1 || isSubmitting}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            
            <div className="flex items-center gap-3">
              {step < 3 ? (
                <Button onClick={nextStep} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Continue <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={() => handleSubmit(formData.scheduleType === "NOW")} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  {isSubmitting ? "Processing..." : formData.scheduleType === "NOW" ? <><Send className="h-4 w-4 mr-2" /> Send Now</> : <><Calendar className="h-4 w-4 mr-2" /> Schedule</>}
                </Button>
              )}
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
