const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const schools = await prisma.school.findMany({
    take: 3,
    orderBy: { createdAt: 'desc' },
    include: {
      users: {
        where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
        include: { user: true }
      }
    }
  });

  const credentials = schools.map(s => {
    return {
      schoolName: s.name,
      schoolCode: s.schoolCode || s.slug || s.tenantId,
      adminEmail: s.users[0]?.user?.email || 'No admin found',
      adminName: s.users[0]?.user?.name || 'N/A'
    };
  });

  console.log("=== LATEST 3 SCHOOLS ===");
  console.table(credentials);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
