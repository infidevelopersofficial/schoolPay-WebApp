/**
 * Database Seeder
 *
 * Creates the default school, admin user, and links them so the app is
 * fully usable immediately after `prisma db push` or `prisma db seed`.
 *
 * Run manually:   npx tsx prisma/seed.ts
 * Run via Prisma: npx prisma db seed
 *
 * IMPORTANT — Prisma 7 + driver adapter:
 * The schema.prisma datasource block has NO `url` field; the connection string
 * is resolved at runtime through prisma.config.ts / DATABASE_URL. A bare
 * `new PrismaClient()` has no way to reach the DB. We must construct it the
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

  // Bypass Native RLS for the duration of this session to allow seeding tenant-scoped data
  await prisma.$executeRawUnsafe("SELECT set_config('app.current_tenant', '', FALSE)")

  // ── 1. Default School (Tenant) ─────────────────────────────────────────────
  const school = await prisma.school.upsert({
    where: { slug: "default-school" },
    update: {},
    create: {
      name: "Default School",
      slug: "default-school",
      email: "admin@school.com",
      phone: "+91-9000000000",
      address: "123 Education Lane, City",
      timezone: "Asia/Kolkata",
      currency: "INR",
      isActive: true,
    },
  })

  console.log("✅ Default school seeded:", school.name, `(id: ${school.id})`)

  // ── 2. Admin User ──────────────────────────────────────────────────────────
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

  // ── 3. Link Admin to School ────────────────────────────────────────────────
  await prisma.userSchool.upsert({
    where: { userId_schoolId: { userId: admin.id, schoolId: school.id } },
    update: {},
    create: {
      userId: admin.id,
      schoolId: school.id,
      role: "ADMIN",
    },
  })

  console.log("✅ Admin linked to school as ADMIN")
  console.log("")
  console.log("🔑 Login credentials:")
  console.log("   Email:    admin@school.com")
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
