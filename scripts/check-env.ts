require('dotenv').config({ path: '.env' })
const { prisma } = require('../lib/prisma')

async function main() {
  const schools = await prisma.$queryRawUnsafe('SELECT COUNT(*) FROM "School"')
  const users = await prisma.$queryRawUnsafe('SELECT COUNT(*) FROM "User"')
  console.log('Total Schools:', schools)
  console.log('Total Users:', users)
}

main().finally(() => prisma.$disconnect())
