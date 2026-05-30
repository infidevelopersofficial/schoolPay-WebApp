import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Presentation, Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "Batch Management — SchoolPay",
  description: "Manage your coaching batches",
};

export default function BatchesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Batches</h1>
          <p className="text-muted-foreground mt-1">Manage class schedules and student groups.</p>
        </div>
        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
          <Plus className="mr-2 h-4 w-4" />
          Create Batch
        </button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Active Batches</CardTitle>
          <CardDescription>You have 0 active batches right now.</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[200px] flex flex-col items-center justify-center text-center p-8 text-muted-foreground border-t border-slate-800">
          <Presentation className="h-12 w-12 mb-4 opacity-20" />
          <p>No batches have been created yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
