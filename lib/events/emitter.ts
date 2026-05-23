import { prisma as db } from "@/lib/prisma"

export type DomainEventType = 
  | "ATTENDANCE_SUBMITTED"
  | "STUDENT_ABSENT"
  | "STUDENT_LATE"
  | "ATTENDANCE_CORRECTED"
  // more types can be added here
  | string;

export interface PublishEventInput {
  eventType: DomainEventType;
  entityType: string;
  entityId: string;
  payload: any;
  schoolId?: string;
  tx?: any; // Allow injecting a Prisma transaction instance
}

/**
 * Publishes a domain event into the DomainEvent outbox table.
 * If a transaction object (tx) is provided, it uses that, ensuring 
 * the event is only committed if the parent transaction succeeds.
 */
export async function publishEvent({
  eventType,
  entityType,
  entityId,
  payload,
  schoolId,
  tx,
}: PublishEventInput) {
  const client = tx || db;

  await client.domainEvent.create({
    data: {
      eventType,
      entityType,
      entityId,
      payload,
      schoolId,
    },
  });
}
