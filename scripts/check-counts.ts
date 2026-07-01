require('dotenv').config({ path: '.env' })
const { prisma } = require('../lib/prisma')

async function main() {
  const total = await prisma.$queryRawUnsafe('SELECT COUNT(*) FROM "Teacher"')
  const withValues = await prisma.$queryRawUnsafe('SELECT COUNT(*) FROM "Teacher" WHERE subject IS NOT NULL OR class IS NOT NULL')
  
  console.log('TOTAL:', total)
  console.log('WITH VALUES:', withValues)
}

main().finally(() => prisma.$disconnect())
