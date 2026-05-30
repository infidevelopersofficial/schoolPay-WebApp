import { NextResponse } from "next/server";
import { getCollectionAnalytics } from "@/lib/dal/analytics/collection";
import { withTenantAuth } from "@/lib/tenant-auth";

/**
 * GET handler for executive collection and recovery analytics.
 * Scoped and secured using RLS-tenant and Auth.js credentials.
 */
export async function GET() {
  try {
    // 1. Secure using active tenant auth boundaries (Authorized: ADMIN and SUPER_ADMIN roles)
    const analytics = await withTenantAuth(null, ["SUPER_ADMIN", "ADMIN"], async () => {
      return await getCollectionAnalytics();
    });

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (err: any) {
    console.error("Error executing recovery collection API handler:", err);
    
    const isAuthError =
      err.name === "UnauthorizedRoleError" ||
      err.name === "UnauthorizedFeatureError" ||
      err.message?.includes("No active school selected");

    return NextResponse.json(
      {
        success: false,
        error: err.message || String(err),
      },
      {
        status: isAuthError ? 403 : 500,
      }
    );
  }
}
