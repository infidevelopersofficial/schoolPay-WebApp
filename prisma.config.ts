/**
 * Prisma 7 Configuration
 *
 * In Prisma 7, ALL connection configuration lives here — NOT in schema.prisma.
 *
 * Two connection strings:
 *  - DATABASE_URL  → pooled endpoint (Neon PgBouncer) — used by the app at runtime
 *  - DIRECT_URL    → unpooled endpoint (Neon direct)  — used by Prisma CLI for
 *                    migrations to avoid prepared-statement errors
 *
 * The `datasource.url` is read by Prisma CLI (migrate, studio, etc).
 * The runtime client in lib/prisma.ts creates its own pool using DATABASE_URL.
 */

import "dotenv/config"
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Use the DIRECT (unpooled) URL for Prisma CLI commands.
    // This avoids prepared-statement errors from PgBouncer during migrations.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
})
