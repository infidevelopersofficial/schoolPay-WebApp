import { AutomationRule } from "@prisma/client";

export interface AutomationExecutionContext {
  schoolId: string;
}

export interface AutomationExecutionResult {
  generatedCount: number;
  skippedCount: number;
  failedCount: number;
}

export interface AutomationRuleConfig {
  offsetDays?: number;
  offsetHours?: number;
  thresholdAmount?: number;
  classes?: string[];
  [key: string]: unknown;
}

export type AutomationRuleHandler = (
  rule: AutomationRule,
  context: AutomationExecutionContext
) => Promise<AutomationExecutionResult>;
