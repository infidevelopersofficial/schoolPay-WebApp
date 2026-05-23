import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, BookOpen } from "lucide-react";

export function TutorDashboard() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">My Learners</CardTitle>
          <Users className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">---</div>
          <p className="text-xs text-muted-foreground">Active students</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
          <Clock className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">---</div>
          <p className="text-xs text-muted-foreground">Scheduled this week</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Subjects Taught</CardTitle>
          <BookOpen className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">---</div>
          <p className="text-xs text-muted-foreground">Active subjects</p>
        </CardContent>
      </Card>
    </div>
  );
}
