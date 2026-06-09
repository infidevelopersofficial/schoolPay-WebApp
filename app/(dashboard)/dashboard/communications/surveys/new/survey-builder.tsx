"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Trash2,
  ListPlus,
  Star,
  Type,
  ChevronLeft,
  Send,
  Save,
  GripVertical,
  Link as LinkIcon,
  Copy,
  CheckCircle2
} from "lucide-react"
import { createSurveyAction, publishSurveyAction } from "../actions"
import { toast } from "sonner"
import { QRCodeSVG } from 'qrcode.react'

// DnD Kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Batch {
  id: string
  name: string
}

interface SurveyBuilderProps {
  batches: Batch[]
  classes: string[]
}

type QuestionType = "TEXT" | "RATING" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE"

interface QuestionBuilder {
  id: string // Need id for sortable
  type: QuestionType
  text: string
  options: string[]
  isRequired: boolean
  newOptionText: string
}

interface SurveyFormData {
  title: string
  description: string
  expiresAt: string
  segmentType: "ENTIRE_SCHOOL" | "CLASS" | "BATCH" | "FEE_DEFAULTERS" | "ATTENDANCE_RISK" | "PERFORMANCE_RISK"
  classValue: string
  batchId: string
  targetAudience: "STUDENTS" | "PARENTS" | "ALL"
  questions: QuestionBuilder[]
}

const SortableQuestion = ({ 
  q, 
  qIdx, 
  onRemove, 
  onTextChange, 
  onRequiredToggle, 
  onAddOption, 
  onRemoveOption, 
  onOptionInputChange 
}: { 
  q: QuestionBuilder
  qIdx: number
  onRemove: () => void
  onTextChange: (val: string) => void
  onRequiredToggle: () => void
  onAddOption: () => void
  onRemoveOption: (optIdx: number) => void
  onOptionInputChange: (val: string) => void
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: q.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`border ${isDragging ? 'border-indigo-500 shadow-xl opacity-80' : 'border-slate-200 dark:border-slate-800 shadow-md'} bg-white dark:bg-slate-900 rounded-2xl overflow-hidden relative mb-4 transition-shadow`}
    >
      <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-violet-600" />
      
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <div {...attributes} {...listeners} className="cursor-grab hover:text-indigo-500 text-slate-400 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 -ml-2">
              <GripVertical className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 px-2.5 py-1 rounded-lg">
              Q{qIdx + 1}: {q.type.replace('_', ' ')}
            </span>
          </div>
          <button type="button" onClick={onRemove} className="text-slate-400 hover:text-red-500 transition-colors p-1">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400">Question Text</label>
          <input
            type="text"
            placeholder="Enter question text..."
            value={q.text}
            onChange={(e) => onTextChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {(q.type === "SINGLE_CHOICE" || q.type === "MULTIPLE_CHOICE") && (
          <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
            <label className="text-xs font-bold text-slate-400 block">Selection Options</label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {q.options.map((opt, optIdx) => (
                <span key={optIdx} className="px-2.5 py-1 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                  {opt}
                  <button type="button" onClick={() => onRemoveOption(optIdx)} className="text-slate-400 hover:text-red-500 font-extrabold">&times;</button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Add option..."
                value={q.newOptionText}
                onChange={(e) => onOptionInputChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAddOption() } }}
                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
              />
              <Button type="button" size="sm" onClick={onAddOption} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-1.5 h-auto">
                + Add
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="flex items-center gap-2">
            <input type="checkbox" id={`required-${q.id}`} checked={q.isRequired} onChange={onRequiredToggle} className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer" />
            <label htmlFor={`required-${q.id}`} className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer select-none">Response is Required</label>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SurveyBuilder({ batches, classes }: SurveyBuilderProps) {
  const router = useRouter()
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
        id: crypto.randomUUID(),
        type: "RATING",
        text: "How would you rate the general facilities of the school?",
        options: [],
        isRequired: true,
        newOptionText: "",
      },
    ],
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [publishedSurvey, setPublishedSurvey] = useState<{ id: string, url: string } | null>(null)
  const [copied, setCopied] = useState(false)

  // Sensors for DnD
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setFormData((prev) => {
        const oldIndex = prev.questions.findIndex((q) => q.id === active.id)
        const newIndex = prev.questions.findIndex((q) => q.id === over.id)
        return { ...prev, questions: arrayMove(prev.questions, oldIndex, newIndex) }
      })
    }
  }

  const handleAddQuestion = (type: QuestionType) => {
    setFormData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: crypto.randomUUID(),
          type,
          text: "",
          options: type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE" ? ["Excellent", "Good", "Average"] : [],
          isRequired: true,
          newOptionText: "",
        },
      ],
    }))
  }

  const validate = (): boolean => {
    if (!formData.title.trim()) { toast.error("Please provide a survey title"); return false }
    if (formData.segmentType === "CLASS" && !formData.classValue) { toast.error("Please select a target class"); return false }
    if (formData.segmentType === "BATCH" && !formData.batchId) { toast.error("Please select a target batch"); return false }
    if (formData.questions.length === 0) { toast.error("Please add at least one question"); return false }

    for (let i = 0; i < formData.questions.length; i++) {
      const q = formData.questions[i]
      if (!q.text.trim()) { toast.error(`Question ${i + 1} text is empty`); return false }
      if ((q.type === "SINGLE_CHOICE" || q.type === "MULTIPLE_CHOICE") && q.options.length < 2) {
        toast.error(`Question ${i + 1} requires at least 2 options`); return false
      }
    }
    return true
  }

  const handleSubmit = async (shouldPublish: boolean) => {
    if (!validate()) return
    setIsSubmitting(true)

    try {
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
      })

      if (!result?.id) throw new Error("Failed to create survey.")

      if (shouldPublish) {
        await publishSurveyAction(result.id)
        toast.success("Survey published and active for parents!")
        // Show share modal
        const shareUrl = `${window.location.origin}/surveys/${result.id}`
        setPublishedSurvey({ id: result.id, url: shareUrl })
      } else {
        toast.success("Survey draft saved successfully!")
        router.push("/dashboard/communications/surveys")
        router.refresh()
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyToClipboard = () => {
    if (!publishedSurvey) return
    navigator.clipboard.writeText(publishedSurvey.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Copied to clipboard!")
  }

  // --- Success Modal Render ---
  if (publishedSurvey) {
    return (
      <div className="space-y-8 p-6 md:p-10 max-w-2xl mx-auto text-center mt-10">
        <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">Survey Published!</h1>
        <p className="text-slate-500 dark:text-slate-400">Your survey is now live. Share the link or QR code below with your audience.</p>
        
        <Card className="mt-8 border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
          <CardContent className="p-8 flex flex-col items-center space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <QRCodeSVG value={publishedSurvey.url} size={200} level="M" includeMargin={true} />
            </div>
            
            <div className="w-full flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
              <LinkIcon className="w-4 h-4 text-slate-500 ml-2" />
              <input readOnly value={publishedSurvey.url} className="flex-1 bg-transparent text-sm focus:outline-none text-slate-700 dark:text-slate-300" />
              <Button onClick={copyToClipboard} variant="outline" size="sm" className="shrink-0 bg-white dark:bg-slate-900">
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Button onClick={() => { router.push("/dashboard/communications/surveys"); router.refresh() }} className="mt-8 w-full bg-indigo-600 hover:bg-indigo-700">
          Return to Dashboard
        </Button>
      </div>
    )
  }

  // --- Builder Render ---
  return (
    <div className="space-y-8 p-6 md:p-10 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/communications/surveys")} className="rounded-full bg-white dark:bg-slate-900 border-slate-200">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">Compose New Survey</h1>
          <p className="text-sm text-slate-500 mt-1">Publish interactive feedback questionnaires targeted securely to school segments.</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4 space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shadow-lg rounded-2xl">
            <CardContent className="p-6 space-y-5">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 border-b pb-2">Survey Settings</h3>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Survey Title</label>
                <input type="text" placeholder="e.g. Parental Satisfaction Poll 2026" value={formData.title} onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Description (Optional)</label>
                <textarea rows={3} placeholder="Details about this poll..." value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none resize-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Expiration Date (Optional)</label>
                <input type="datetime-local" value={formData.expiresAt} onChange={(e) => setFormData(p => ({ ...p, expiresAt: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shadow-lg rounded-2xl">
            <CardContent className="p-6 space-y-5">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 border-b pb-2">Target Audience</h3>
              <div className="space-y-1.5">
                <select value={formData.segmentType} onChange={(e) => setFormData(p => ({ ...p, segmentType: e.target.value as any }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none">
                  <option value="ENTIRE_SCHOOL">Entire School</option>
                  <option value="CLASS">Class-wise Group</option>
                  <option value="BATCH">Batch-wise Group</option>
                  <option value="FEE_DEFAULTERS">Fee Defaulters Only</option>
                </select>
              </div>
              {formData.segmentType === "CLASS" && (
                <select value={formData.classValue} onChange={(e) => setFormData(p => ({ ...p, classValue: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none">
                  <option value="">-- Choose Class --</option>
                  {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
              {formData.segmentType === "BATCH" && (
                <select value={formData.batchId} onChange={(e) => setFormData(p => ({ ...p, batchId: e.target.value }))} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none">
                  <option value="">-- Choose Batch --</option>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              )}
              <div className="grid grid-cols-3 gap-2 p-1 border bg-slate-50/50 dark:bg-slate-950/20 rounded-xl">
                {[{ role: "ALL", label: "All" }, { role: "STUDENTS", label: "Students" }, { role: "PARENTS", label: "Parents" }].map(r => (
                  <button key={r.role} type="button" onClick={() => setFormData(p => ({ ...p, targetAudience: r.role as any }))} className={`py-1.5 text-xs font-semibold rounded-lg ${formData.targetAudience === r.role ? "bg-indigo-600 text-white" : "text-slate-500"}`}>{r.label}</button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="font-bold text-xl">Survey Questions</h3>
              <p className="text-xs text-slate-400">Drag to reorder questions.</p>
            </div>
            <div className="flex gap-1.5">
              <Button type="button" size="sm" onClick={() => handleAddQuestion("RATING")} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs gap-1"><Star className="h-3 w-3 text-amber-500" /> +Rating</Button>
              <Button type="button" size="sm" onClick={() => handleAddQuestion("SINGLE_CHOICE")} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs gap-1"><ListPlus className="h-3 w-3 text-violet-500" /> +Choice</Button>
              <Button type="button" size="sm" onClick={() => handleAddQuestion("TEXT")} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs gap-1"><Type className="h-3 w-3 text-cyan-500" /> +Text</Button>
            </div>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={formData.questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
              {formData.questions.map((q, qIdx) => (
                <SortableQuestion
                  key={q.id}
                  q={q}
                  qIdx={qIdx}
                  onRemove={() => setFormData(p => ({ ...p, questions: p.questions.filter(x => x.id !== q.id) }))}
                  onTextChange={(val) => setFormData(p => { const updated = [...p.questions]; updated[qIdx].text = val; return { ...p, questions: updated } })}
                  onRequiredToggle={() => setFormData(p => { const updated = [...p.questions]; updated[qIdx].isRequired = !updated[qIdx].isRequired; return { ...p, questions: updated } })}
                  onAddOption={() => {
                    if (!q.newOptionText.trim()) return
                    setFormData(p => { const updated = [...p.questions]; updated[qIdx].options.push(q.newOptionText.trim()); updated[qIdx].newOptionText = ""; return { ...p, questions: updated } })
                  }}
                  onRemoveOption={(optIdx) => setFormData(p => { const updated = [...p.questions]; updated[qIdx].options.splice(optIdx, 1); return { ...p, questions: updated } })}
                  onOptionInputChange={(val) => setFormData(p => { const updated = [...p.questions]; updated[qIdx].newOptionText = val; return { ...p, questions: updated } })}
                />
              ))}
            </SortableContext>
          </DndContext>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => handleSubmit(false)} className="flex gap-1.5"><Save className="h-4 w-4" /> Save as Draft</Button>
            <Button type="button" disabled={isSubmitting} onClick={() => handleSubmit(true)} className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white flex gap-1.5"><Send className="h-4 w-4" /> Publish Survey</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
