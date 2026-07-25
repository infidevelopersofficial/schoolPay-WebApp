import { NextResponse } from "next/server";
import { processAutomationRules } from "@/lib/automation/process-rules";
import { verifyCronAuth } from "@/lib/utils/cron-auth";

/**
 * Trigger endpoint for automated rules evaluation background task.
 * Protected via CRON_SECRET key variables.
 */
async function handleJobTrigger(request: Request) {
  try {
    // 1. Mandatory fail-closed CRON_SECRET authentication
    const authError = verifyCronAuth(request);
    if (authError) return authError;


    // 2. Execute the automation processor
    const metrics = await processAutomationRules();

    return NextResponse.json({
      success: true,
      processedRules: metrics.processedRules,
      generatedEvents: metrics.generatedEvents,
      skippedEvents: metrics.skippedEvents,
      failedEvents: metrics.failedEvents,
    });
  } catch (err: any) {
    console.error("Critical error inside process-automation job handler:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || String(err),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return handleJobTrigger(request);
}

export async function GET(request: Request) {
  return handleJobTrigger(request);
}
