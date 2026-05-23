"use client";

import { useState } from "react";
import { completeOnboarding } from "./actions";

export function CoachingSetupForm() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await completeOnboarding(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Primary Courses</label>
        <input name="courses" className="w-full p-2 border rounded-md" placeholder="e.g. JEE, NEET, Foundation" required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Number of Batches</label>
        <input name="batches" type="number" className="w-full p-2 border rounded-md" placeholder="e.g. 5" required />
      </div>
      <button disabled={loading} className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md disabled:opacity-50">
        {loading ? "Saving..." : "Complete Setup"}
      </button>
    </form>
  );
}
