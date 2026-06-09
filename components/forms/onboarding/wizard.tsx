"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { completeWizardOnboarding } from "./actions";

export function OnboardingWizard({ tenantType }: { tenantType: string }) {
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    slug: "",
    region: "India",
    language: "English",
    country: "India",
    state: "",
    city: "",
    timezone: "Asia/Kolkata",
    currency: "INR",
    academicYear: "2026-2027",
    classesCount: "10",
    coursesCount: "2",
    batchesCount: "5",
    subjectsCount: "5"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = () => {
    startTransition(async () => {
      // Convert to FormData for the server action
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });
      data.append("tenantType", tenantType);

      const result = await completeWizardOnboarding(data);
      if (result.success) {
        toast({ title: "Setup Complete", description: "Your workspace is ready!" });
        if (result.redirectTo) {
          router.push(result.redirectTo);
        }
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-primary/10">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">Step {step} of 3</span>
          <div className="flex gap-1">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-2 w-12 rounded-full ${step >= s ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>
        </div>
        <CardTitle className="text-2xl">
          {step === 1 && "Organization Details"}
          {step === 2 && "Location & Compliance"}
          {step === 3 && "Academic Setup"}
        </CardTitle>
        <CardDescription>
          {step === 1 && "Set up your unique workspace URL and region."}
          {step === 2 && "Configure billing and regional settings."}
          {step === 3 && "Define your core academic structure."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div>
                <label className="block text-sm font-medium mb-1">Workspace URL (Slug) *</label>
                <div className="flex items-center">
                  <Input name="slug" value={formData.slug} onChange={handleChange} placeholder="e.g. greenvalley" required className="rounded-r-none" />
                  <div className="bg-muted px-3 py-2 border border-l-0 rounded-r-md text-sm text-muted-foreground">.schoolpay.in</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Data Region</label>
                  <select name="region" value={formData.region} onChange={handleChange} className="w-full p-2 border rounded-md">
                    <option>India</option>
                    <option>UAE</option>
                    <option>Singapore</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Default Language</label>
                  <select name="language" value={formData.language} onChange={handleChange} className="w-full p-2 border rounded-md">
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Marathi</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Country</label>
                  <Input name="country" value={formData.country} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State *</label>
                  <Input name="state" value={formData.state} onChange={handleChange} placeholder="Required for GST" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <Input name="city" value={formData.city} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Currency</label>
                  <select name="currency" value={formData.currency} onChange={handleChange} className="w-full p-2 border rounded-md">
                    <option>INR</option>
                    <option>AED</option>
                    <option>USD</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              {tenantType === "SCHOOL" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Academic Year</label>
                    <Input name="academicYear" value={formData.academicYear} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Total Classes to Generate</label>
                    <Input name="classesCount" type="number" value={formData.classesCount} onChange={handleChange} />
                  </div>
                </>
              )}
              {tenantType === "COACHING_CENTER" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Courses Count</label>
                    <Input name="coursesCount" type="number" value={formData.coursesCount} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Batches per Course</label>
                    <Input name="batchesCount" type="number" value={formData.batchesCount} onChange={handleChange} />
                  </div>
                </>
              )}
              {tenantType === "PRIVATE_TUTOR" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Subjects Count</label>
                  <Input name="subjectsCount" type="number" value={formData.subjectsCount} onChange={handleChange} />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between mt-8 pt-4 border-t">
          <Button variant="outline" onClick={handleBack} disabled={step === 1 || isPending}>
            Back
          </Button>
          
          {step < 3 ? (
            <Button onClick={handleNext} disabled={isPending || (step === 1 && !formData.slug) || (step === 2 && !formData.state)}>
              Next Step
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Creating Workspace..." : "Complete Setup"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
