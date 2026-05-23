const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const plans = await prisma.plan.findMany();
  console.log("--- Plans ---");
  console.table(plans.map(p => ({ Name: p.name, Price: p.monthlyPrice, Students: p.studentLimit, Staff: p.staffLimit })));

  const schools = await prisma.school.findMany({ include: { plan: true } });
  console.log("--- Schools & Plans ---");
  
  const planCounts = {};
  const statusCounts = {};

  for (const s of schools) {
    const planName = s.plan?.name || "NONE";
    planCounts[planName] = (planCounts[planName] || 0) + 1;
    statusCounts[s.subscriptionStatus] = (statusCounts[s.subscriptionStatus] || 0) + 1;
  }
  
  console.log("Total Schools:", schools.length);
  console.log("Schools by Plan:", planCounts);
  console.log("Schools by Sub Status:", statusCounts);
}

main().catch(console.error).finally(() => prisma.$disconnect());
