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

  await prisma.$executeRawUnsafe("SELECT set_config('app.current_tenant', '', FALSE)")
  
  await prisma.user.deleteMany({});
  await prisma.school.deleteMany({});
  await prisma.spayTeamUser.deleteMany({});

  const hashedRavi = await bcrypt.hash("Admin@123", 12)
  const hashedAdmin = await bcrypt.hash("Admin@123", 12)
  const hashedStaff = await bcrypt.hash("Staff@123", 12)
  const hashedStudent = await bcrypt.hash("Arjun2015", 12)
  const hashedParent = await bcrypt.hash("Parent@123", 12)

  await prisma.spayTeamUser.upsert({
    where: { email: "ravi@schoolpay.in" },
    update: { password: hashedRavi },
    create: {
      name: "Ravi",
      email: "ravi@schoolpay.in",
      password: hashedRavi,
      role: "SUPER_ADMIN",
    }
  })
  
  const freeDemoPlan = await prisma.plan.upsert({
    where: { name: "FREE_DEMO" },
    update: {},
    create: { name: "FREE_DEMO", monthlyPrice: 0 }
  })
  
  const proPlan = await prisma.plan.upsert({
    where: { name: "PRO" },
    update: {},
    create: { name: "PRO", monthlyPrice: 4999 }
  })

  const sunrise = await prisma.school.upsert({
    where: { schoolCode: "SPAY-SCH-001" },
    update: {},
    create: {
      schoolCode: "SPAY-SCH-001",
      name: "Sunrise School",
      slug: "sunrise-school",
      tenantId: "SPAY-SCH-001",
      tenantType: "SCHOOL",
      planId: freeDemoPlan.id,
      isDemo: true,
      demoExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      city: "Mumbai",
      state: "Maharashtra",
      isActive: true,
    }
  })

  const moonlight = await prisma.school.upsert({
    where: { schoolCode: "SPAY-SCH-200" },
    update: {},
    create: {
      schoolCode: "SPAY-SCH-200",
      name: "Moonlight Academy",
      slug: "moonlight-academy",
      tenantId: "SPAY-SCH-200",
      tenantType: "COACHING_CENTER",
      planId: proPlan.id,
      isDemo: false,
      city: "Pune",
      state: "Maharashtra",
      isActive: true,
    }
  })

  const srAdmin = await prisma.user.upsert({
    where: { email: "admin@sunrise.schoolpay.in" },
    update: { hashedPassword: hashedAdmin },
    create: { name: "Sunrise Admin", email: "admin@sunrise.schoolpay.in", hashedPassword: hashedAdmin, role: "ADMIN" }
  })
  await prisma.userSchool.upsert({
    where: { userId_schoolId: { userId: srAdmin.id, schoolId: sunrise.id } },
    update: {},
    create: { userId: srAdmin.id, schoolId: sunrise.id, role: "ADMIN" }
  })

  const srStaff = await prisma.user.upsert({
    where: { email: "staff@sunrise.com" },
    update: { hashedPassword: hashedStaff },
    create: { name: "Sunrise Staff", email: "staff@sunrise.com", hashedPassword: hashedStaff, role: "TEACHER" }
  })
  await prisma.userSchool.upsert({
    where: { userId_schoolId: { userId: srStaff.id, schoolId: sunrise.id } },
    update: { staffId: "TCH-001" },
    create: { userId: srStaff.id, schoolId: sunrise.id, role: "TEACHER", staffId: "TCH-001" }
  })

  const srParentUser = await prisma.user.upsert({
    where: { email: "suresh@gmail.com" },
    update: {},
    create: { name: "Suresh", email: "suresh@gmail.com", hashedPassword: hashedParent, role: "PARENT" }
  })
  await prisma.userSchool.upsert({
    where: { userId_schoolId: { userId: srParentUser.id, schoolId: sunrise.id } },
    update: {},
    create: { userId: srParentUser.id, schoolId: sunrise.id, role: "PARENT" }
  })
  
  let srParent = await prisma.parent.findFirst({ where: { userId: srParentUser.id, schoolId: sunrise.id } })
  if (!srParent) {
    srParent = await prisma.parent.create({
      data: {
        userId: srParentUser.id,
        schoolId: sunrise.id,
        name: "Suresh",
        email: "suresh@gmail.com",
        mobile: "9999999999",
      }
    })
  }

  const srStudentUser = await prisma.user.upsert({
    where: { email: "student@sunrise.com" },
    update: { hashedPassword: hashedStudent },
    create: { name: "Arjun", email: "student@sunrise.com", hashedPassword: hashedStudent, role: "STUDENT" }
  })
  await prisma.userSchool.upsert({
    where: { userId_schoolId: { userId: srStudentUser.id, schoolId: sunrise.id } },
    update: {},
    create: { userId: srStudentUser.id, schoolId: sunrise.id, role: "STUDENT" }
  })

  let srClass = await prisma.class.findFirst({ where: { schoolId: sunrise.id } })
  if (!srClass) {
    srClass = await prisma.class.create({ data: { schoolId: sunrise.id, name: "10th Grade", section: "A" } })
  }
  let srClass2 = await prisma.class.findFirst({ where: { schoolId: sunrise.id, name: "11th Grade" } })
  if (!srClass2) {
    srClass2 = await prisma.class.create({ data: { schoolId: sunrise.id, name: "11th Grade", section: "A" } })
  }
  let srClass3 = await prisma.class.findFirst({ where: { schoolId: sunrise.id, name: "12th Grade" } })
  if (!srClass3) {
    srClass3 = await prisma.class.create({ data: { schoolId: sunrise.id, name: "12th Grade", section: "A" } })
  }

  let srStudent = await prisma.student.findFirst({ where: { studentId: "SRS-STU-001", schoolId: sunrise.id } })
  if (!srStudent) {
    srStudent = await prisma.student.create({
      data: {
        schoolId: sunrise.id,
        userId: srStudentUser.id,
        studentId: "SRS-STU-001",
        name: "Arjun",
        email: "student@sunrise.com",
        admissionNumber: "ADM-001",
        parentId: srParent.id,
        accountStatus: "ACTIVE",
        portalAccessEnabled: true,
        class: "10th Grade"
      }
    })
  }

  const mlAdmin = await prisma.user.upsert({
    where: { email: "admin@moonlight.com" },
    update: {},
    create: { name: "Moonlight Admin", email: "admin@moonlight.com", hashedPassword: hashedAdmin, role: "ADMIN" }
  })
  await prisma.userSchool.upsert({
    where: { userId_schoolId: { userId: mlAdmin.id, schoolId: moonlight.id } },
    update: {},
    create: { userId: mlAdmin.id, schoolId: moonlight.id, role: "ADMIN" }
  })

  console.log("Output shows: SpayTeamUser, Sunrise school, Moonlight school, staff, parent, student, 3 classes created.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
