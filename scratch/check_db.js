const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRaw`
    SELECT is_nullable, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'Class' AND column_name = 'classTeacher';
  `;
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
