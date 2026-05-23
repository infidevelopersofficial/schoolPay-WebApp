import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Presentation, Target } from "lucide-react";

export function CoachingDashboard() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          <Users className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">---</div>
          <p className="text-xs text-muted-foreground">Active enrollments</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Active Batches</CardTitle>
          <Presentation className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">---</div>
          <p className="text-xs text-muted-foreground">Ongoing sessions</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
          <Target className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">---</div>
          <p className="text-xs text-muted-foreground">Pending inquiries</p>
        </CardContent>
      </Card>
    </div>
  );
}
