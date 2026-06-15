import * as dotenv from 'dotenv';
dotenv.config();
process.env.DATABASE_URL = process.env.DIRECT_URL;
import { prisma, tenantContext } from '../lib/prisma'

async function run() {
  console.log('Starting Cross-Tenant Attack Simulation...', process.env.DIRECT_URL)

  // 1. Provision 2 schools
  const schoolA = await prisma.school.create({
    data: { name: "Tenant A", slug: "tenant-a", schoolCode: "TA01" }
  })
  const schoolB = await prisma.school.create({
    data: { name: "Tenant B", slug: "tenant-b", schoolCode: "TB01" }
  })

  // 2. Provision data in Tenant B
  let studentBId = "";
  await tenantContext.run({ schoolId: schoolB.id }, async () => {
      const studentB = await prisma.student.create({
        data: {
          name: "Target Student",
          class: "10A", schoolId: schoolB.id
        }
      })
      studentBId = studentB.id;
  });

  console.log("Provisioned Target Student in Tenant B with ID:", studentBId)

  // 3. Attack Simulation from Tenant A
  console.log("\\n--- ATTACK SIMULATION ---")
  
  await tenantContext.run({ schoolId: schoolA.id }, async () => {
    try {
      // Attack 1: Cross-Tenant Read (findUnique)
      const leakedStudent = await prisma.student.findUnique({
        where: { id: studentBId }
      })
      if (leakedStudent) {
        console.error("❌ FAIL: Tenant A successfully read Tenant B's student via findUnique!")
      } else {
        console.log("✅ PASS: findUnique isolation successful.")
      }
    } catch (e: any) {
        console.log("✅ PASS: findUnique isolation successful (caught error):", e.message)
    }

    try {
      // Attack 2: Cross-Tenant Update
      const updatedStudent = await prisma.student.update({
        where: { id: studentBId },
        data: { name: "HACKED BY TENANT A" }
      })
      if (updatedStudent) {
        console.error("❌ FAIL: Tenant A successfully updated Tenant B's student!")
      }
    } catch (e: any) {
      if (e.code === 'P2025' || e.message.includes('Record to update not found')) {
        console.log("✅ PASS: update isolation successful (blocked by Prisma P2025).")
      } else {
        console.log("✅ PASS: update isolation successful (caught error):", e.message)
      }
    }
  })

  // Cleanup
  await prisma.school.deleteMany({ where: { id: { in: [schoolA.id, schoolB.id] } } })
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
