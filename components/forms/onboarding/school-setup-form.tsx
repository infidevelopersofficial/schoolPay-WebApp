"use client";

import { useState, useTransition } from "react";
import { completeOnboarding } from "./actions";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

export function SchoolSetupForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await completeOnboarding(formData);
      if (result.success) {
        toast({
          title: "Success",
          description: "School setup completed.",
        });
        if (result.redirectTo) {
          router.push(result.redirectTo);
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Something went wrong.",
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Academic Year</label>
        <input name="academicYear" className="w-full p-2 border rounded-md" defaultValue="2026-2027" required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Total Classes</label>
        <input name="totalClasses" type="number" className="w-full p-2 border rounded-md" placeholder="e.g. 10" required />
      </div>
      <button disabled={isPending} className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md disabled:opacity-50">
        {isPending ? "Saving..." : "Complete Setup"}
      </button>
    </form>
  );
}
