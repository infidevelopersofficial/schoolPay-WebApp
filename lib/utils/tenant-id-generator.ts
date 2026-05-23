import { prisma } from "@/lib/prisma"

const PREFIX_MAP: Record<string, string> = {
  SCHOOL: "SCH",
  COACHING_CENTER: "CLS",
  PRIVATE_TUTOR: "TUT",
}

/**
 * Generates a unique, sequential Tenant ID (e.g. SCH-2026-0001)
 * Uses a database transaction to ensure atomicity and prevent race conditions.
 */
export async function generateTenantId(tenantType: "SCHOOL" | "COACHING_CENTER" | "PRIVATE_TUTOR"): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = PREFIX_MAP[tenantType] || "TEN"

  // We use Prisma's upsert within a transaction to atomically increment the counter
  const result = await prisma.$transaction(async (tx) => {
    const counter = await tx.tenantIdCounter.upsert({
      where: {
        type_year: {
          type: tenantType,
          year: year,
        },
      },
      update: {
        counter: { increment: 1 },
      },
      create: {
        type: tenantType,
        year: year,
        counter: 1,
      },
    })
    return counter.counter
  })

  // Format with leading zeros, e.g., 0001
  const paddedCounter = String(result).padStart(4, "0")
  
  return `${prefix}-${year}-${paddedCounter}`
}
