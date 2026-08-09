import { getParentDetail } from "@/lib/dal/parents"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function ParentDetailPage({ params }: { params: { id: string } }) {
  const parent = await getParentDetail(params.id)

  if (!parent) {
    notFound()
  }

  const formatCurrency = (amount: number) => {
    return `\u20B9${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Parent Profile</h1>
        <Badge variant={parent.isActive ? "default" : "secondary"}>
          {parent.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Info Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Contact Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{parent.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{parent.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mobile</p>
              <p className="font-medium">{parent.mobile}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Relationship</p>
              <p className="font-medium">{parent.relationship || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Occupation</p>
              <p className="font-medium">{parent.occupation || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">{parent.address || "—"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Linked Students & Fee Summary */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Linked Students & Fee Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {parent.students.length > 0 ? (
                <div className="space-y-6">
                  {parent.students.map((student) => (
                    <div key={student.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-start border-b pb-4">
                        <div>
                          <p className="text-lg font-semibold">{student.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Class: {student.class}{student.section ? ` - ${student.section}` : ""} 
                            {student.studentId && ` | ID: ${student.studentId}`}
                          </p>
                        </div>
                        <Badge variant={
                          student.feeStatus === "PAID" ? "default" :
                          student.feeStatus === "OVERDUE" ? "destructive" : "secondary"
                        }>
                          {student.feeStatus}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 pt-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Fees</p>
                          <p className="font-medium">{formatCurrency(student.totalFees.toNumber())}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Paid Amount</p>
                          <p className="font-medium text-green-600">{formatCurrency(student.paidAmount.toNumber())}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Pending Amount</p>
                          <p className="font-medium text-red-600">{formatCurrency(student.pendingAmount.toNumber())}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No students linked to this parent account.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
