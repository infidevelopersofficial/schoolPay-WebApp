import { prisma as db } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant-context";

export async function getSchoolDashboardStats() {
  const { schoolId } = await getTenantContext();

  const [studentsCount, teachersCount, classesCount, totalCollections, recentPayments, recentActivities, revenueData] = await Promise.all([
    db.student.count({ where: { schoolId, isActive: true } }),
    db.teacher.count({ where: { schoolId, isActive: true } }),
    db.class.count({ where: { schoolId } }),
    db.payment.aggregate({
      where: { schoolId, status: "COMPLETED" },
      _sum: { amount: true },
    }),
    db.payment.findMany({
      where: { schoolId, status: "COMPLETED" },
      orderBy: { date: "desc" },
      take: 5,
      include: { student: { select: { name: true, admissionNumber: true } } },
    }),
    db.auditLog.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, action: true, entityType: true, createdAt: true, userEmail: true }
    }),
    getRevenueData(schoolId)
  ]);

  return {
    studentsCount,
    teachersCount,
    classesCount,
    totalCollections: totalCollections._sum.amount || 0,
    recentPayments,
    recentActivities,
    revenueData
  };
}

async function getRevenueData(schoolId: string) {
  // Aggregate completed payments grouped by month for the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const payments = await db.payment.findMany({
    where: { 
      schoolId, 
      status: "COMPLETED",
      date: { gte: sixMonthsAgo }
    },
    select: { amount: true, date: true }
  });

  const monthlyData: Record<string, number> = {};
  
  // Initialize last 6 months with 0
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthYear = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    monthlyData[monthYear] = 0;
  }

  payments.forEach((p: any) => {
    const monthYear = new Date(p.date).toLocaleString('en-US', { month: 'short', year: 'numeric' });
    if (monthlyData[monthYear] !== undefined) {
      monthlyData[monthYear] += p.amount;
    }
  });

  return Object.keys(monthlyData).map(name => ({
    name,
    amount: monthlyData[name]
  }));
}
