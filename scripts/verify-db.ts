import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

async function main() {
  console.log("🔍 Verifying Database Status...\n")

  const connString = process.env.DIRECT_URL ?? process.env.DATABASE_URL
  if (!connString) {
    console.error("❌ DATABASE_URL or DIRECT_URL not found")
    process.exit(1)
  }

  const pool = new Pool({ connectionString: connString })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  try {
    // 1. Connection Test
    await prisma.$queryRaw`SELECT 1`
    console.log("✅ Connection: Successful")

    // 2. Table List & Row Counts
    const tables = [
      "School", "User", "UserSchool", "Student", "Teacher", "Parent",
      "Class", "Batch", "Enrollment", "Subject", "Fee", "Invoice",
      "Payment", "Lesson", "Exam", "Result", "Attendance", "Event",
      "Message", "Announcement", "AcademicSession", "AuditLog",
      "Account", "Session", "VerificationToken"
    ]

    console.log("\n📊 Table Statistics:")
    console.log("--------------------------------------------------")
    console.log("Table Name".padEnd(25) + "Row Count")
    console.log("--------------------------------------------------")

    for (const table of tables) {
      try {
        const count = await (prisma as any)[table.charAt(0).toLowerCase() + table.slice(1)].count()
        console.log(table.padEnd(25) + count)
      } catch (e) {
        console.log(table.padEnd(25) + "Error or Not Found")
      }
    }

    // 3. RLS Check
    console.log("\n🛡️ Row-Level Security Check:")
    const rlsCheck = await prisma.$queryRawUnsafe(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('Student', 'Teacher', 'Parent', 'Class', 'Batch')
    `) as any[]
    
    rlsCheck.forEach(row => {
      console.log(`${row.tablename.padEnd(25)} RLS Enabled: ${row.rowsecurity}`)
    })

    // 4. Migration Status
    console.log("\n📅 Migration Check:")
    const migrations = await prisma.$queryRawUnsafe(`SELECT * FROM "_prisma_migrations"`) as any[]
    console.log(`Total migrations applied: ${migrations.length}`)

  } catch (error) {
    console.error("❌ Verification failed:", error)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main()
