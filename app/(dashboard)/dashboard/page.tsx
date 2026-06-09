import { getTenantContext } from "@/lib/tenant-context";
import { SchoolDashboard } from "@/components/dashboards/school-dashboard";
import { CoachingDashboard } from "@/components/dashboards/coaching-dashboard";
import { TutorDashboard } from "@/components/dashboards/tutor-dashboard";
import { ActivationChecklist } from "@/components/dashboards/activation-checklist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — SchoolPay",
  description: "View your dashboard and manage your account",
};

export default async function DashboardPage() {
  const { tenantType, onboardingStatus, schoolId } = await getTenantContext();

  // Show onboarding alert if setup not complete
  const showSetupAlert = onboardingStatus !== "COMPLETED";

  return (
    <div className="space-y-6">
      {/* Setup Alert */}
      {showSetupAlert && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-900">Setup In Progress</h3>
                <p className="text-sm text-amber-800 mt-1">
                  Complete your school setup to unlock all features.{" "}
                  <a href="/dashboard/onboarding" className="font-semibold underline hover:text-amber-700">
                    Continue Setup →
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Post-Onboarding Checklist (Mocked condition for testing, ideally based on actual data presence) */}
      {!showSetupAlert && (
        <ActivationChecklist isComplete={false} schoolId={schoolId} tenantType={tenantType} />
      )}

      {/* Tenant-specific Dashboard */}
      {tenantType === "COACHING_CENTER" ? (
        <CoachingDashboard />
      ) : tenantType === "PRIVATE_TUTOR" ? (
        <TutorDashboard />
      ) : (
        <SchoolDashboard />
      )}
    </div>
  );
}
