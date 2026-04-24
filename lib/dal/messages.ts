import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { withDAL } from "@/lib/dal/utils"
import { getSchoolId } from "@/lib/tenant-context"
import { logger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"

const log = logger.child({ domain: "messages" })

export const sendMessageSchema = z.object({
  from: z.string().min(1),
  fromEmail: z.string().email(),
  to: z.string().min(1),
  toEmail: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
})

export async function getMessages(opts?: { email?: string }) {
  const schoolId = await getSchoolId()
  const { email } = opts ?? {}
  return withDAL(
    "messages.getAll",
    () =>
      prisma.message.findMany({
        where: {
          schoolId,
          ...(email && { OR: [{ toEmail: email }, { fromEmail: email }] }),
        },
        orderBy: { createdAt: "desc" },
      }),
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}

export async function sendMessage(input: z.infer<typeof sendMessageSchema>) {
  const schoolId = await getSchoolId()
  const validated = sendMessageSchema.parse(input)
  return withDAL(
    "messages.send",
    () =>
      prisma.message.create({
        data: { ...validated, schoolId },
      }),
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
}
