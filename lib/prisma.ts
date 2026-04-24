/**
 * Prisma Client Singleton — Prisma 7 with pg Driver Adapter
 *
 * Observability & resilience additions over the original:
 *
 * 1. Explicit pg.Pool config
 *    - `max: 10`              — hard cap; prevents connection storms under load
 *    - `idleTimeoutMillis`    — reclaim idle connections quickly
 *    - `connectionTimeoutMillis` — fail fast when the DB is unreachable instead
 *                                  of queuing requests indefinitely
 *    Without these, the default pool has no acquire timeout.  A DB outage
 *    silently queues every in-flight request until Node runs out of memory,
 *    then crashes the worker thread.
 *
 * 2. Slow-query detection via `$on("query")` (dev only)
 *    Logs queries that exceed THRESHOLDS.DB_COMPLEX_QUERY as warnings.
 *
 * 3. DB-level error/warn events forwarded to structured logger + Sentry.
 *
 * 4. Graceful shutdown on SIGTERM / SIGINT
 *    Closes both the Prisma client and the underlying pg pool so in-flight
 *    transactions complete and connections are returned cleanly.
 */

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import * as Sentry from "@sentry/nextjs"
import { dbLogger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"

// ─── Pool configuration ───────────────────────────────────────────────────────

const POOL_CONFIG = {
  connectionString: process.env.DATABASE_URL,
  /** Hard cap on open connections. Prevents thundering-herd on DB restart. */
  max: Number(process.env.DB_POOL_MAX ?? 10),
  /**
   * How long (ms) an idle connection is kept open before being destroyed.
   * 30 s keeps the pool warm without leaking connections in low-traffic periods.
   */
  idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS ?? 30_000),
  /**
   * How long (ms) to wait for an available connection before throwing.
   * Without this, requests pile up silently during a DB outage.
   */
  connectionTimeoutMillis: Number(process.env.DB_CONN_TIMEOUT_MS ?? 5_000),
}

// ─── Singleton ────────────────────────────────────────────────────────────────

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pgPool: Pool | undefined
}

function createPrismaClient(): PrismaClient {
  const pool = new Pool(POOL_CONFIG)

  // Surface pg pool-level errors so they don't become unhandled rejections.
  pool.on("error", (err) => {
    dbLogger.error({ err }, "Unexpected pg pool error")
    Sentry.captureException(err, { tags: { component: "pg-pool" } })
  })

  // Store a reference so the graceful-shutdown handler can call pool.end().
  globalForPrisma.pgPool = pool

  const adapter = new PrismaPg(pool)

  const client = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? [
            { emit: "event", level: "query" },
            { emit: "event", level: "warn" },
            { emit: "event", level: "error" },
          ]
        : [
            { emit: "event", level: "warn" },
            { emit: "event", level: "error" },
          ],
  })

  // ── Slow-query detection (dev) ─────────────────────────────────────────────
  if (process.env.NODE_ENV === "development") {
    client.$on("query", (e) => {
      if (e.duration > THRESHOLDS.DB_COMPLEX_QUERY) {
        dbLogger.warn(
          {
            query: e.query,
            params: e.params,
            durationMs: e.duration,
            thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY,
          },
          "Slow Prisma query",
        )
        Sentry.addBreadcrumb({
          category: "db",
          message: "Slow query detected",
          level: "warning",
          data: { durationMs: e.duration, query: e.query.slice(0, 200) },
        })
      }
    })
  }

  // ── DB-level events → structured logger ───────────────────────────────────
  client.$on("warn", (e) => {
    dbLogger.warn({ target: e.target }, e.message)
  })

  client.$on("error", (e) => {
    dbLogger.error({ target: e.target }, e.message)
    Sentry.captureMessage(`Prisma error: ${e.message}`, {
      level: "error",
      extra: { target: e.target },
    })
  })

  return client
}

import { AsyncLocalStorage } from "async_hooks"

export const tenantContext = new AsyncLocalStorage<{ schoolId: string }>()

export const prisma = (globalForPrisma.prisma ?? createPrismaClient()).$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const store = tenantContext.getStore()
        
        // If context is initialized (even if schoolId is ""), apply Native RLS
        if (store !== undefined) {
          // Bypass Native RLS explicitly for the User and Account models which span tenants
          // Also skip if it's not a tenant-scoped model (this prevents unnecessary transaction overhead)
          const modelsWithSchoolId = [
            "Student", "Teacher", "Parent", "Class", "Batch", "Enrollment",
            "Subject", "Fee", "Invoice", "Payment", "Lesson", "Exam", "Result",
            "Attendance", "Event", "Message", "Announcement", "AcademicSession"
          ]

          if (modelsWithSchoolId.includes(model)) {
            // Apply native Postgres Row-Level Security via sequential transaction
            // The empty string '' is used for System Context (bypassing RLS)
            const [, result] = await (globalForPrisma.prisma ?? prisma).$transaction([
              (globalForPrisma.prisma ?? prisma).$executeRawUnsafe(`SELECT set_config('app.current_tenant', '${store.schoolId}', TRUE)`),
              query(args) as any
            ])
            return result
          }
        }
        
        // Default execution (unprotected / non-tenant model)
        return query(args)
      }
    }
  }
}) as PrismaClient // Cast back to PrismaClient to avoid complex type spreading

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma as any

// ─── Graceful shutdown ────────────────────────────────────────────────────────
// Registers once per process. Ensures in-flight queries complete and all
// connections are returned before the process exits.  Without this, SIGTERM
// (used by Docker / Kubernetes) can leave transactions open.

if (process.env.NODE_ENV !== "test") {
  // Guard flag prevents double-close when Next.js build workers share the
  // same pool reference but each register their own signal handler.
  let shutdownStarted = false

  const shutdown = async (signal: string) => {
    if (shutdownStarted) return
    shutdownStarted = true

    dbLogger.info({ signal }, "Shutdown signal received — closing DB connections")
    try {
      await prisma.$disconnect()
      await globalForPrisma.pgPool?.end()
      dbLogger.info("DB connections closed cleanly")
    } catch (err: any) {
      if (err?.message !== "Called end on pool more than once") {
        dbLogger.error({ err }, "Error during DB shutdown")
      }
    }
  }

  process.once("SIGTERM", () => shutdown("SIGTERM"))
  process.once("SIGINT", () => shutdown("SIGINT"))
}
