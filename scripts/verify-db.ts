import { prisma } from '../lib/prisma';

async function main() {
  const school = await prisma.school.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      sessions: true,
      classes: true,
      fees: true,
      auditLogs: true
    }
  });

  console.log(JSON.stringify(school, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
