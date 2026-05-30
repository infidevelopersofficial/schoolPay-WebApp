import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import bcrypt from "bcryptjs"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  await prisma.$executeRawUnsafe("SELECT set_config('app.current_tenant', '', FALSE)")
  const school = await prisma.school.findFirst()
  
  const hashedPassword = await bcrypt.hash("password123", 10)
  
  const user = await prisma.user.upsert({
    where: { email: "parent@test.com" },
    update: { hashedPassword },
    create: {
      email: "parent@test.com",
      hashedPassword,
      name: "Test Parent",
      role: "PARENT"
    }
  })
  
  if (!school) return;
  const student = await prisma.student.findFirst({ where: { schoolId: school.id } })
  if (student) {
    await prisma.parent.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        name: "Test Parent",
        email: "parent@test.com",
        schoolId: school.id,
        mobile: "1234567890",
        students: { connect: { id: student.id } }
      }
    })
  }

  console.log("Parent seeded: parent@test.com / password123")
}

main().finally(() => process.exit(0))
