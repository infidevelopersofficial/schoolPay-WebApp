import { NextResponse } from "next/server";

/**
 * This route was used for local development testing of the student creation flow.
 * It is disabled in all environments to prevent accidental data mutation from
 * an unauthenticated public endpoint.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV !== "development" || process.env.ENABLE_TEST_ROUTES !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ 
    message: "Test route is disabled. Set ENABLE_TEST_ROUTES=true in .env.local to re-enable during development only." 
  }, { status: 403 });
}
