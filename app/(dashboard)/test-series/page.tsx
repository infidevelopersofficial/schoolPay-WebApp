import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "Test Series — SchoolPay",
  description: "Manage tests and mock exams",
};

export default function TestSeriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Test Series</h1>
          <p className="text-muted-foreground mt-1">Create and manage mock exams for students.</p>
        </div>
        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
          <Plus className="mr-2 h-4 w-4" />
          Create Test
        </button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Available Tests</CardTitle>
          <CardDescription>You have 0 tests scheduled right now.</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[200px] flex flex-col items-center justify-center text-center p-8 text-muted-foreground border-t border-slate-800">
          <BookOpen className="h-12 w-12 mb-4 opacity-20" />
          <p>No tests have been created yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
