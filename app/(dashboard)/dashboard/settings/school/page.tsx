import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SchoolProfileForm } from "@/components/school-profile/school-profile-form";
import { getTenantContext } from "@/lib/tenant-context";
import { prisma as db } from "@/lib/prisma";

export default async function SchoolProfilePage() {
  const { schoolId } = await getTenantContext();
  const tenant = await db.school.findUnique({ where: { id: schoolId } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">School Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your institution's details and branding</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Institution Details</CardTitle>
          <CardDescription>
            These details are used on receipts, reports, and public facing pages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SchoolProfileForm initialData={tenant} />
        </CardContent>
      </Card>
    </div>
  );
}
