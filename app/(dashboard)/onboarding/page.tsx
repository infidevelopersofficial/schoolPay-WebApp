import { getTenantContext } from "@/lib/tenant-context";
import { redirect } from "next/navigation";
import { SchoolSetupForm } from "@/components/forms/onboarding/school-setup-form";
import { CoachingSetupForm } from "@/components/forms/onboarding/coaching-setup-form";
import { TutorSetupForm } from "@/components/forms/onboarding/tutor-setup-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function OnboardingPage() {
  const { tenantType, onboardingStatus } = await getTenantContext();

  if (onboardingStatus === "COMPLETED") {
    redirect("/");
  }

  return (
    <div className="max-w-2xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to SchoolPay!</CardTitle>
          <CardDescription>
            Let's get your {tenantType === "SCHOOL" ? "school" : tenantType === "COACHING_CENTER" ? "coaching center" : "tutoring profile"} set up.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tenantType === "SCHOOL" && <SchoolSetupForm />}
          {tenantType === "COACHING_CENTER" && <CoachingSetupForm />}
          {tenantType === "PRIVATE_TUTOR" && <TutorSetupForm />}
        </CardContent>
      </Card>
    </div>
  );
}
