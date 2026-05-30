import { Suspense } from "react"
import { getFees } from "@/lib/dal/fees"
import { StructureClient } from "./client-page"
import { prisma } from "@/lib/prisma"

export const metadata = { title: "Fee Structure | SchoolPay" }

export default async function FeeStructurePage() {
  const fees = await getFees()
  const sessions = await prisma.academicSession.findMany({ orderBy: { startDate: 'desc' } })
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StructureClient initialFees={fees} sessions={sessions} />
    </Suspense>
  )
}
