import { prisma } from "../lib/prisma";

async function main() {
  const schools = await prisma.school.findMany({
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
      id: s.id,
      schoolName: s.name,
      schoolCode: s.schoolCode || s.slug || s.tenantId,
      adminEmail: s.users[0]?.user?.email || 'No admin found',
      adminName: s.users[0]?.user?.name || 'N/A'
    };
  });

  console.log(`=== TOTAL SCHOOLS: ${schools.length} ===`);
  console.table(credentials);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
