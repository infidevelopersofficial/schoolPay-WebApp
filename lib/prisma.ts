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

import "server-only"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import * as Sentry from "@sentry/nextjs"
import { dbLogger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"

// ─── Pool configuration ───────────────────────────────────────────────────────

function getPoolConfig() {
  if (!process.env.DATABASE_URL) {
    try {
      require("dotenv").config()
    } catch {}
  }
  const isDev = process.env.NODE_ENV === "development"
  return {
    connectionString: process.env.DATABASE_URL,
    /**
     * Hard cap on open connections.
     * Neon free tier allows ~10 total connections across all pools.
     * Keep this low so we don't exhaust the limit.
     */
    max: Number(process.env.DB_POOL_MAX ?? 5),
    /**
     * How long (ms) an idle connection is kept open before being destroyed.
     * Neon suspends compute after ~5 min of inactivity, so keeping idle
     * connections alive longer just causes "Connection terminated" errors on
     * the next request. Use a short timeout so stale connections are recycled.
     */
    idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS ?? 10_000),
    /**
     * How long (ms) to wait for a connection from the pool before throwing.
     * Neon serverless cold-starts can take 2–10 s to wake the compute up.
     * 15 s in development (where cold starts are frequent) and 10 s in prod.
     */
    connectionTimeoutMillis: Number(
      process.env.DB_CONN_TIMEOUT_MS ?? (isDev ? 15_000 : 10_000)
    ),
    /**
     * Enable TCP keep-alive so the OS sends keep-alive probes on idle
     * connections, preventing silent drops by network middleboxes.
     */
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pgPool: Pool | undefined
}

function createPrismaClient(): PrismaClient {
  const pool = new Pool(getPoolConfig())

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
            // We enforce tenant isolation at the Prisma runtime level.
            // Executing `set_config` inside an array $transaction for every query 
            // caused P2028 connection exhaustion when mixed with interactive DAL transactions.
            
            if (store.schoolId !== "") {
              // 1. Bulk Operations & Safe Reads
              if (operation === "findMany" || operation === "findFirst" || operation === "findFirstOrThrow" || operation === "count" || operation === "aggregate" || operation === "groupBy" || operation === "updateMany" || operation === "deleteMany") {
                args.where = { ...args.where, schoolId: store.schoolId }
              }
              // 2. Safe Creates
              else if (operation === "create" || operation === "createMany") {
                if (Array.isArray(args.data)) {
                  args.data = args.data.map(d => ({ ...d, schoolId: store.schoolId }))
                } else {
                  args.data = { ...args.data, schoolId: store.schoolId }
                }
              }
              // 3. Unsafe Reads (findUnique) -> Rewrite to findFirst to avoid type errors while maintaining isolation
              else if (operation === "findUnique" || operation === "findUniqueOrThrow") {
                args.where = { ...args.where, schoolId: store.schoolId }
                const safeOp = operation === "findUnique" ? "findFirst" : "findFirstOrThrow"
                return (prisma as any)[model][safeOp](args)
              }
              // 4. Unsafe Writes (update, delete) -> Pre-flight Ownership Check
              else if (operation === "update" || operation === "delete") {
                // Verify ownership before mutating
                const existing = await (prisma as any)[model].findFirst({
                  where: { ...args.where },
                  select: { schoolId: true }
                })
                if (!existing || existing.schoolId !== store.schoolId) {
                  throw new Error(`PrismaClientKnownRequestError: Record to ${operation} not found or belongs to another tenant.`)
                }
                // Safely proceed
              }
            }
          }
        }
        
        // Execute the query securely
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
