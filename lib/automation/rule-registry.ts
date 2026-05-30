import { AutomationRuleHandler } from "./types";
import { processFeeReminderRule } from "./rules/fee-reminder";
import { processOverdueFeeRule } from "./rules/overdue-fee";
import { processExamReminderRule } from "./rules/exam-reminder";
import { processAssignmentReminderRule } from "./rules/assignment-reminder";
import { processAttendanceEscalationRule } from "./rules/attendance-escalation";
import { processPerformanceAlertRule } from "./rules/performance-alert";
import { processFeeOverdueEscalationRule } from "./rules/fee-overdue-escalation";
import { processAutoPenaltyGenerationRule } from "./rules/auto-penalty-generation";
import { processCollectionReportRule } from "./rules/collection-report-rule";

/**
 * Global Rule Registry mapping rule eventTypes to their respective execution handlers.
 */
export const RULE_REGISTRY: Record<string, AutomationRuleHandler> = {
  FEE_REMINDER: processFeeReminderRule,
  FEE_OVERDUE: processOverdueFeeRule,
  EXAM_REMINDER: processExamReminderRule,
  ASSIGNMENT_REMINDER: processAssignmentReminderRule,
  ATTENDANCE_ESCALATION: processAttendanceEscalationRule,
  LOW_PERFORMANCE_ALERT: processPerformanceAlertRule,
  FEE_OVERDUE_ESCALATION: processFeeOverdueEscalationRule,
  AUTO_PENALTY_GENERATION: processAutoPenaltyGenerationRule,
  COLLECTION_REPORT: processCollectionReportRule,
};
