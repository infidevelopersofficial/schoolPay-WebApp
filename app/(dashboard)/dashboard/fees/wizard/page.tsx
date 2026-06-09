import { prisma } from "@/lib/prisma"
import { getSchoolId } from "@/lib/tenant-context"
import { FeeWizard } from "@/components/fees/fee-wizard"

export const metadata = { title: "Create Fee Structure | SchoolPay" }

export default async function FeeWizardPage() {
  const schoolId = await getSchoolId()
  
  const classes = await prisma.class.findMany({
    where: { schoolId },
    orderBy: [{ grade: 'asc' }, { section: 'asc' }]
  })

  const sessions = await prisma.academicSession.findMany({
    where: { schoolId },
    orderBy: { startDate: 'desc' }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Create Fee Structure</h1>
        <p className="text-sm text-muted-foreground">Follow the wizard to set up a new fee structure and generate invoices.</p>
      </div>

      <FeeWizard classes={classes} sessions={sessions} />
    </div>
  )
}
