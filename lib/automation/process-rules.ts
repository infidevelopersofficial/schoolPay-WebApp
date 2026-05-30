import { prisma } from "@/lib/prisma";
import { RULE_REGISTRY } from "./rule-registry";
import { calculateNextRunAt } from "./scheduler";

export interface AutomationRunMetrics {
  processedRules: number;
  generatedEvents: number;
  skippedEvents: number;
  failedEvents: number;
}

/**
 * Core automation processor that polls, triggers, and tracks active automation rules.
 * Enforces tenant boundary separation and captures execution statistics.
 */
export async function processAutomationRules(): Promise<AutomationRunMetrics> {
  const now = new Date();

  // 1. Fetch enabled rules due for execution
  const rules = await prisma.automationRule.findMany({
    where: {
      enabled: true,
      OR: [
        { nextRunAt: null },
        { nextRunAt: { lte: now } },
      ],
    },
  });

  const metrics: AutomationRunMetrics = {
    processedRules: 0,
    generatedEvents: 0,
    skippedEvents: 0,
    failedEvents: 0,
  };

  for (const rule of rules) {
    const startTime = new Date();
    const handler = RULE_REGISTRY[rule.eventType];

    if (!handler) {
      console.warn(`[Automation Processor] No registered handler found for eventType: ${rule.eventType}`);
      continue;
    }

    try {
      // 2. Execute the rule under isolated school boundary context
      const runResult = await handler(rule, { schoolId: rule.schoolId });

      const endTime = new Date();
      const durationMs = endTime.getTime() - startTime.getTime();

      // Commit metrics
      metrics.processedRules++;
      metrics.generatedEvents += runResult.generatedCount;
      metrics.skippedEvents += runResult.skippedCount;
      metrics.failedEvents += runResult.failedCount;

      // 3. Update scheduling state and store successful execution log
      const nextRunAt = calculateNextRunAt(rule.scheduleType, endTime);

      await prisma.$transaction([
        prisma.automationRule.update({
          where: { id: rule.id },
          data: {
            lastRunAt: endTime,
            nextRunAt,
          },
        }),
        prisma.automationExecutionLog.create({
          data: {
            schoolId: rule.schoolId,
            ruleId: rule.id,
            status: "SUCCESS",
            generatedCount: runResult.generatedCount,
            skippedCount: runResult.skippedCount,
            failedCount: runResult.failedCount,
            startedAt: startTime,
            endedAt: endTime,
            durationMs,
          },
        }),
      ]);
    } catch (err: any) {
      console.error(`[Automation Processor] Rule ${rule.id} failed during execution:`, err);
      
      const endTime = new Date();
      const durationMs = endTime.getTime() - startTime.getTime();
      const nextRunAt = calculateNextRunAt(rule.scheduleType, endTime);

      // 4. Update schedules and store failure description on errors to prevent locking
      try {
        await prisma.$transaction([
          prisma.automationRule.update({
            where: { id: rule.id },
            data: {
              lastRunAt: endTime,
              nextRunAt,
            },
          }),
          prisma.automationExecutionLog.create({
            data: {
              schoolId: rule.schoolId,
              ruleId: rule.id,
              status: "FAILED",
              startedAt: startTime,
              endedAt: endTime,
              durationMs,
              errorMessage: err.message || String(err),
            },
          }),
        ]);
      } catch (dbErr) {
        console.error("Critical: Failed to save automation failure log", dbErr);
      }
    }
  }

  return metrics;
}
