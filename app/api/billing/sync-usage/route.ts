import { NextResponse } from "next/server"
import { prisma as db } from "@/lib/prisma"
import { verifyCronAuth } from "@/lib/utils/cron-auth"

export async function POST(req: Request) {
  try {
    // 1. Mandatory fail-closed CRON_SECRET authentication
    const authError = verifyCronAuth(req)
    if (authError) return authError


    // 2. Fetch all schools
    const schools = await db.school.findMany({
      select: { id: true }
    })

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    // 3. Recalculate usage for each school
    // We do this sequentially to avoid overwhelming the database with parallel heavy counts,
    // or batch it in a real production scenario.
    for (const school of schools) {
      try {
        const studentCount = await db.student.count({
          where: { schoolId: school.id } // Optionally filter by ACTIVE status
        })

        const staffCount = await db.teacher.count({
          where: { schoolId: school.id } // Optionally filter by ACTIVE status
        })

        await db.usageRecord.upsert({
          where: { schoolId: school.id },
          update: {
            currentStudents: studentCount,
            currentStaff: staffCount,
            lastCalculatedAt: new Date()
          },
          create: {
            schoolId: school.id,
            currentStudents: studentCount,
            currentStaff: staffCount,
            lastCalculatedAt: new Date()
          }
        })
        results.success++
      } catch (err: any) {
        results.failed++
        results.errors.push(`Failed to sync usage for school \${school.id}: \${err.message}`)
      }
    }

    return NextResponse.json({
      message: "Usage sync completed",
      results
    })

  } catch (error: any) {
    console.error("Usage sync error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
