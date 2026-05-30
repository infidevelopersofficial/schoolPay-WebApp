import { AutomationScheduleType } from "@prisma/client";

/**
 * Calculates the next execution timestamp based on the schedule type
 * and baseline execution time.
 */
export function calculateNextRunAt(
  scheduleType: AutomationScheduleType,
  fromTime: Date = new Date()
): Date {
  const nextDate = new Date(fromTime.getTime());

  switch (scheduleType) {
    case AutomationScheduleType.DAILY:
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case AutomationScheduleType.WEEKLY:
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case AutomationScheduleType.MONTHLY:
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case AutomationScheduleType.RELATIVE:
      // RELATIVE rules evaluate dynamic date windows, requiring standard daily check intervals
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    default:
      nextDate.setDate(nextDate.getDate() + 1);
  }

  return nextDate;
}
