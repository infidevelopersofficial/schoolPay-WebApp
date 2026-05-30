import { prisma } from "@/lib/prisma";

export interface DeduplicationCheckOptions {
  schoolId: string;
  userId: string;
  eventType: string;
  entityId: string;
  stage: string;
}

/**
 * Checks if a specific automation reminder event has already been generated
 * for a user, entity, and offset stage to prevent duplicate alerts.
 */
export async function isEventDuplicate(
  options: DeduplicationCheckOptions
): Promise<boolean> {
  const { schoolId, userId, eventType, entityId, stage } = options;

  // Fetch all matching domain events for the given entity and type within the school
  const events = await prisma.domainEvent.findMany({
    where: {
      schoolId,
      eventType,
      entityId,
    },
    select: {
      payload: true,
    },
  });

  // Verify if any historical event carries the same stage and target recipient
  for (const event of events) {
    const payload = event.payload as Record<string, unknown> | null;
    if (payload && payload.stage === stage && payload.userId === userId) {
      return true;
    }
  }

  return false;
}
