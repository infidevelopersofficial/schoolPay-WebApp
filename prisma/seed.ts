/**
 * Database Seeder
 *
 * Creates the default admin user so the app is usable immediately after
 * `prisma migrate dev` or `prisma migrate deploy`.
 *
 * Run manually:   npx tsx prisma/seed.ts
 * Run via Prisma: npx prisma db seed
 *
 * IMPORTANT — Prisma 7 + driver adapter:
 * The schema.prisma datasource block has NO `url` field; the connection string
 * is resolved at runtime through prisma.config.ts / DATABASE_URL.  A bare
 * `new PrismaClient()` has no way to reach the DB.  We must construct it the
 * same way lib/prisma.ts does — with the PrismaPg adapter.
 */

import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import bcrypt from "bcryptjs"

if (!process.env.DATABASE_URL) {
  console.error("❌  DATABASE_URL is not set. Copy .env.example to .env and fill it in.")
  process.exit(1)
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Seeding database...")

  const hashedPassword = await bcrypt.hash("admin123", 12)

  const admin = await prisma.user.upsert({
    where: { email: "admin@school.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@school.com",
      hashedPassword,
      role: "ADMIN",
    },
  })

  console.log("✅ Admin user seeded:", admin.email)
  console.log("   Password: admin123")
  console.log("")
  console.log("🎉 Seeding complete!")
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
