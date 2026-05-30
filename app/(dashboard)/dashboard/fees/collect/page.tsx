import { Suspense } from "react"
import { CollectClient } from "./client-page"
import { getStudents } from "@/lib/dal/students"
import { getFees } from "@/lib/dal/fees"
import { getPayments } from "@/lib/dal/payments"
import { prisma } from "@/lib/prisma"
import { getSchoolId } from "@/lib/tenant-context"

export const metadata = { title: "Collect Fees | SchoolPay" }

export default async function FeeCollectionPage(props: {
  searchParams?: Promise<{ studentId?: string; q?: string }>
}) {
  const searchParams = await props.searchParams
  const query = searchParams?.q || ""
  const studentId = searchParams?.studentId || ""
  const schoolId = await getSchoolId()
  
  // Find students by name/id
  let searchResults: any[] = []
  if (query.length > 2) {
    searchResults = await prisma.student.findMany({
      where: {
        schoolId,
        isActive: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { studentId: { contains: query, mode: "insensitive" } }
        ]
      },
      take: 10,
      include: { parent: true }
    })
  }

  // Find specific student details if selected
  let selectedStudent: any = null
  let pendingFees: any[] = []
  let pastPayments: any[] = []
  
  if (studentId) {
    selectedStudent = await prisma.student.findUnique({
      where: { id: studentId },
      include: { 
        parent: true,
        session: true
      }
    })
    
    if (selectedStudent && selectedStudent.schoolId === schoolId) {
      // Find fees applicable to this student (match class and session)
      const allFees = await getFees()
      pendingFees = allFees.filter(f => 
        (f.className === "All" || f.className === selectedStudent?.class) &&
        (!f.sessionId || f.sessionId === selectedStudent?.sessionId)
      )
      
      const paymentsRes = await getPayments({ studentId, limit: 10 })
      pastPayments = paymentsRes.payments
    }
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CollectClient 
        searchQuery={query}
        searchResults={searchResults}
        selectedStudent={selectedStudent}
        pendingFees={pendingFees}
        pastPayments={pastPayments}
      />
    </Suspense>
  )
}
