import { getTenantContext } from "@/lib/tenant-context";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/forms/onboarding/wizard";

export default async function OnboardingPage() {
  const { tenantType, onboardingStatus } = await getTenantContext();

  if (onboardingStatus === "COMPLETED") {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <OnboardingWizard tenantType={tenantType} />
    </div>
  );
}
