import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const parent = await prisma.user.findFirst({ where: { role: 'PARENT' } })
  const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } })
  console.log("Parent:", parent?.email)
  console.log("Student:", student?.email)
}

main()
