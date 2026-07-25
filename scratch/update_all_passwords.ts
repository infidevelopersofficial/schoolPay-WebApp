import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import dotenv from "dotenv"

dotenv.config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function updateAllPasswords() {
  console.log("🔐 Updating all login credentials to: Sarathi@2025")
  const newPasswordHash = await bcrypt.hash("Sarathi@2025", 12)

  // Update all standard users (Admin, Teacher, Parent, Student)
  const userResult = await prisma.user.updateMany({
    data: {
      hashedPassword: newPasswordHash,
    },
  })
  console.log(`✅ Updated ${userResult.count} standard users in User table.`)

  // Update all SuperAdmin / internal team users
  const teamResult = await prisma.spayTeamUser.updateMany({
    data: {
      password: newPasswordHash,
    },
  })
  console.log(`✅ Updated ${teamResult.count} super admin / team users in SpayTeamUser table.`)

  await prisma.$disconnect()
  await pool.end()
}

updateAllPasswords().catch((e) => {
  console.error("❌ Error updating passwords:", e)
  process.exit(1)
})
