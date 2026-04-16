/**
 * Health Check Endpoint  GET /api/health
 *
 * Returns a structured JSON payload describing the live status of every
 * critical dependency. Designed to be polled by:
 * - Load balancers (return 200 = healthy, 503 = degraded)
 * - Uptime monitoring tools (e.g., Better Uptime, Checkly, Grafana Synthetic)
 * - Internal dashboards
 *
 * Response shape:
 * {
 *   status: "ok" | "degraded" | "error",
 *   version: string,
 *   uptime: number,         // process uptime in seconds
 *   timestamp: string,      // ISO-8601
 *   checks: {
 *     database: { status, latencyMs? },
 *   },
 *   memory: { heapUsedMb, heapTotalMb, rssMb }
 * }
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { systemLogger } from "@/lib/logger"

const VERSION = process.env.npm_package_version ?? process.env.APP_VERSION ?? "unknown"
const DB_TIMEOUT_MS = 3_000

type CheckStatus = "ok" | "degraded" | "error"

interface HealthResponse {
  status: CheckStatus
  version: string
  uptime: number
  timestamp: string
  checks: {
    database: { status: CheckStatus; latencyMs?: number; error?: string }
  }
  memory: { heapUsedMb: number; heapTotalMb: number; rssMb: number }
}

async function checkDatabase(): Promise<{ status: CheckStatus; latencyMs?: number; error?: string }> {
  const start = performance.now()
  try {
    // Use a timeout race so a hung connection doesn't block the health check.
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("DB health check timed out")), DB_TIMEOUT_MS),
      ),
    ])
    return { status: "ok", latencyMs: Math.round(performance.now() - start) }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { status: "error", latencyMs: Math.round(performance.now() - start), error: message }
  }
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const db = await checkDatabase()

  const mem = process.memoryUsage()
  const memory = {
    heapUsedMb: Math.round(mem.heapUsed / 1_048_576),
    heapTotalMb: Math.round(mem.heapTotal / 1_048_576),
    rssMb: Math.round(mem.rss / 1_048_576),
  }

  const overallStatus: CheckStatus =
    db.status === "error" ? "error" : db.status === "degraded" ? "degraded" : "ok"

  const body: HealthResponse = {
    status: overallStatus,
    version: VERSION,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    checks: { database: db },
    memory,
  }

  if (overallStatus !== "ok") {
    systemLogger.warn({ health: body }, "Health check returned non-ok status")
  }

  const httpStatus = overallStatus === "error" ? 503 : 200
  return NextResponse.json(body, { status: httpStatus })
}
