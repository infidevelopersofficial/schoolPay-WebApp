"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { createFeeStructureWizardAction, getMappedClassesStrengthAction, generateInvoicesAction } from "@/app/(dashboard)/dashboard/fees/actions"
import { Plus, Trash2, ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

// Needs to be shared with backend or imported
const feeItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.coerce.number().positive("Amount must be positive"), // Rupee amount in UI, convert to paise for backend
  frequency: z.enum(["MONTHLY", "QUARTERLY", "YEARLY", "ONE_TIME"]),
  gstRate: z.coerce.number().min(0).optional().default(0),
})

const step1Schema = z.object({
  name: z.string().min(1, "Structure name is required"),
  description: z.string().optional(),
  sessionId: z.string().min(1, "Academic session is required"),
  items: z.array(feeItemSchema).min(1, "At least one fee item is required"),
})

export function FeeWizard({ classes, sessions }: { classes: any[], sessions: any[] }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [strengthData, setStrengthData] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedStructureId, setGeneratedStructureId] = useState<string | null>(null)

  const form = useForm<z.infer<typeof step1Schema>>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      name: "",
      description: "",
      sessionId: sessions.find(s => s.isCurrent)?.id || "",
      items: [{ name: "Tuition Fee", amount: 0, frequency: "MONTHLY", gstRate: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  const currentItems = form.watch("items")

  const onNextStep1 = async () => {
    const isValid = await form.trigger()
    if (isValid) setStep(2)
  }

  const onNextStep2 = async () => {
    if (selectedClasses.length === 0) {
      toast.error("Select at least one class")
      return
    }
    
    setIsSubmitting(true)
    const result = await getMappedClassesStrengthAction(selectedClasses)
    setIsSubmitting(false)
    
    if ("error" in result) {
      toast.error(result.error)
      return
    }
    
    setStrengthData(result.data || [])
    setStep(3)
  }

  const onSubmit = async () => {
    setIsSubmitting(true)
    const data = form.getValues()
    
    // Convert Rupee amounts to paise
    const itemsInPaise = data.items.map(item => ({
      ...item,
      amount: Math.round(item.amount * 100)
    }))

    const result = await createFeeStructureWizardAction({
      name: data.name,
      description: data.description,
      sessionId: data.sessionId,
      items: itemsInPaise,
      classIds: selectedClasses
    })

    if ("error" in result) {
      toast.error(result.error)
      setIsSubmitting(false)
      return
    }

    toast.success("Fee structure created!")
    setGeneratedStructureId(result.structureId || null)
    setStep(4)
    setIsSubmitting(false)
  }

  const onGenerateInvoices = async () => {
    if (!generatedStructureId) return
    setIsSubmitting(true)
    const result = await generateInvoicesAction(generatedStructureId)
    setIsSubmitting(false)

    if ("error" in result) {
      toast.error(result.error)
    } else {
      toast.success(`Generated ${result.count} invoices successfully!`)
      router.push("/dashboard/fees")
      router.refresh()
    }
  }

  // Calculate totals for preview
  const totalStudents = strengthData.reduce((acc, curr) => acc + curr.strength, 0)
  const monthlyTotal = currentItems.filter(i => i.frequency === "MONTHLY").reduce((acc, curr) => acc + curr.amount, 0) * totalStudents
  const quarterlyTotal = currentItems.filter(i => i.frequency === "QUARTERLY").reduce((acc, curr) => acc + curr.amount, 0) * totalStudents

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center">
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full border-2 font-semibold text-sm",
              step >= i ? "border-primary bg-primary text-primary-foreground" : "border-muted text-muted-foreground"
            )}>
              {step > i ? <Check className="w-4 h-4" /> : i}
            </div>
            {i < 4 && (
              <div className={cn(
                "w-24 h-1 mx-2 rounded",
                step > i ? "bg-primary" : "bg-muted"
              )} />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 && "Fee Structure Details"}
            {step === 2 && "Assign to Classes"}
            {step === 3 && "Review & Confirm"}
            {step === 4 && "Generate Invoices"}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Define the fee structure and its components."}
            {step === 2 && "Select the classes that will follow this fee structure."}
            {step === 3 && "Review the expected invoice generation based on class strength."}
            {step === 4 && "Structure created! Now generate the initial invoices."}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Structure Name</Label>
                  <Input placeholder="e.g. 2025-26 Standard Tuition" {...form.register("name")} />
                  {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Academic Session</Label>
                  <Select onValueChange={(v) => form.setValue("sessionId", v)} defaultValue={form.getValues("sessionId")}>
                    <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
                    <SelectContent>
                      {sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Description (Optional)</Label>
                  <Input placeholder="Notes about this structure" {...form.register("description")} />
                </div>
              </div>

              <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-medium text-sm text-muted-foreground">Fee Components</h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "", amount: 0, frequency: "MONTHLY", gstRate: 0 })}>
                    <Plus className="w-4 h-4 mr-2" /> Add Item
                  </Button>
                </div>
                
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-3 items-end border p-3 rounded-md bg-muted/20">
                    <div className="col-span-4 space-y-2">
                      <Label className="text-xs">Item Name</Label>
                      <Input {...form.register(`items.${index}.name`)} placeholder="e.g. Tuition" />
                    </div>
                    <div className="col-span-3 space-y-2">
                      <Label className="text-xs">Amount (₹)</Label>
                      <Input type="number" step="0.01" {...form.register(`items.${index}.amount`)} />
                    </div>
                    <div className="col-span-3 space-y-2">
                      <Label className="text-xs">Frequency</Label>
                      <Select onValueChange={(v: any) => form.setValue(`items.${index}.frequency`, v)} defaultValue={field.frequency}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MONTHLY">Monthly</SelectItem>
                          <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                          <SelectItem value="YEARLY">Yearly</SelectItem>
                          <SelectItem value="ONE_TIME">One-Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-1 space-y-2">
                      <Label className="text-xs">GST %</Label>
                      <Input type="number" {...form.register(`items.${index}.gstRate`)} />
                    </div>
                    <div className="col-span-1 pb-1">
                      <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => remove(index)} disabled={fields.length === 1}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {classes.map(c => (
                <div key={c.id} className={cn(
                  "flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 cursor-pointer transition-colors",
                  selectedClasses.includes(c.id) ? "border-primary bg-primary/5" : "hover:border-primary/50"
                )}
                onClick={() => {
                  if (selectedClasses.includes(c.id)) {
                    setSelectedClasses(selectedClasses.filter(id => id !== c.id))
                  } else {
                    setSelectedClasses([...selectedClasses, c.id])
                  }
                }}>
                  <Checkbox checked={selectedClasses.includes(c.id)} />
                  <div className="space-y-1 leading-none">
                    <Label className="cursor-pointer">{c.name} {c.section}</Label>
                  </div>
                </div>
              ))}
              {classes.length === 0 && (
                <div className="col-span-full py-8 text-center text-muted-foreground">
                  No classes found. Please create classes first.
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="border rounded-lg p-4 space-y-4 bg-muted/10">
                  <h3 className="font-medium flex items-center justify-between border-b pb-2">
                    <span>Class Mapping</span>
                    <span className="text-muted-foreground text-sm">{totalStudents} Total Students</span>
                  </h3>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                    {strengthData.map(c => (
                      <div key={c.id} className="flex justify-between items-center text-sm">
                        <span>{c.name} {c.section}</span>
                        <span className="font-medium">{c.strength} students</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border rounded-lg p-4 space-y-4 bg-primary/5 border-primary/20">
                  <h3 className="font-medium flex items-center justify-between border-b border-primary/10 pb-2">
                    <span>Expected Generation</span>
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Monthly Collection:</span>
                      <span className="font-medium text-lg">₹{monthlyTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Quarterly Collection:</span>
                      <span className="font-medium text-lg">₹{quarterlyTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                <Check className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold">Fee Structure Created!</h2>
              <p className="text-muted-foreground max-w-md">
                The fee structure has been successfully mapped to the selected classes. 
                You can now generate the initial invoices (Student Fee Mappings) for all {totalStudents} enrolled students.
              </p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between border-t p-6">
          {step > 1 && step < 4 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          ) : (
            <div /> // Placeholder for flex spacing
          )}

          {step === 1 && (
            <Button onClick={onNextStep1}>
              Next Step <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {step === 2 && (
            <Button onClick={onNextStep2} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Preview Generation <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {step === 3 && (
            <Button onClick={onSubmit} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Confirm & Create Structure
            </Button>
          )}

          {step === 4 && (
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => router.push("/dashboard/fees")}>
                Do Later
              </Button>
              <Button onClick={onGenerateInvoices} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Generate Invoices Now
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
