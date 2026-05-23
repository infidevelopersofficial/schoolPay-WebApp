import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "Lead Management — SchoolPay",
  description: "Track and manage prospective students",
};

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground mt-1">Track prospective students and inquiries.</p>
        </div>
        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
          <Plus className="mr-2 h-4 w-4" />
          Add Lead
        </button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Inquiries</CardTitle>
          <CardDescription>You have 0 pending leads right now.</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[200px] flex flex-col items-center justify-center text-center p-8 text-muted-foreground border-t border-slate-800">
          <Users className="h-12 w-12 mb-4 opacity-20" />
          <p>No leads have been tracked yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
