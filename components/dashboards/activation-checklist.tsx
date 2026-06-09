import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, Circle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export async function ActivationChecklist({ isComplete, schoolId, tenantType }: { isComplete: boolean; schoolId: string; tenantType: string }) {
  if (isComplete) return null;

  // 1. Fetch Tenant Stats
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { logoUrl: true, razorpayOrderId: true }
  });

  const teacherCount = await prisma.teacher.count({ where: { schoolId } });
  const studentCount = await prisma.student.count({ where: { schoolId } });
  const feeCount = await prisma.fee.count({ where: { schoolId } });
  const sessionCount = await prisma.academicSession.count({ where: { schoolId } });

  const tasks = [
    { title: "Workspace Created", done: true, link: "#" },
    { title: "Academic Session Configured", done: sessionCount > 0, link: "/dashboard/settings" },
    { title: "Upload Logo & Branding", done: !!school?.logoUrl, link: "/dashboard/settings" },
    { title: tenantType === "SCHOOL" ? "Configure Fees" : "Configure Courses", done: feeCount > 0, link: "/dashboard/fees" },
    { title: "Add Teachers", done: teacherCount > 0, link: "/dashboard/staff" },
    { title: "Add Students", done: studentCount > 0, link: "/dashboard/students" },
    { title: "Connect Payment Gateway", done: !!school?.razorpayOrderId, link: "/dashboard/settings" },
  ];

  const progress = Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100);

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Welcome to your Dashboard!</CardTitle>
            <CardDescription>Let's get your workspace fully operational.</CardDescription>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-primary">{progress}%</span>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Completed</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden mb-6">
          <div className="h-full bg-primary transition-all duration-500 ease-in-out" style={{ width: `${progress}%` }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task, i) => (
            <Link key={i} href={task.link}>
              <div className={`flex items-center p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors ${task.done ? 'opacity-70' : 'opacity-100'}`}>
                {task.done ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground mr-3 flex-shrink-0" />
                )}
                <span className={`flex-1 text-sm ${task.done ? 'line-through text-muted-foreground' : 'font-medium'}`}>
                  {task.title}
                </span>
                {!task.done && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
