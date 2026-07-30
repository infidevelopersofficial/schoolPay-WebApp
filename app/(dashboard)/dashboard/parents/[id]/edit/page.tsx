import { getParent } from "@/lib/dal/parents"
import { getStudents } from "@/lib/dal/students"
import { notFound } from "next/navigation"
import { AddParentForm } from "@/components/forms/add-parent-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function EditParentPage({ params }: { params: { id: string } }) {
  const parent = await getParent(params.id)

  if (!parent) {
    notFound()
  }

  // Fetch all students for the dropdown
  const { students } = await getStudents({ limit: 1000 })

  // Map database model to form expected fields
  const initialData = {
    id: parent.id,
    name: parent.name,
    email: parent.email,
    mobile: parent.mobile,
    relationship: parent.relationship || "Father",
    occupation: parent.occupation || "",
    address: parent.address || "",
    studentIds: parent.students.map(s => s.id),
  }

  return (
    <div className="max-w-3xl mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Parent/Guardian: {parent.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <AddParentForm 
            mode="edit" 
            initialData={initialData} 
            open={true} 
            onOpenChange={() => {}} 
            students={students}
          />
        </CardContent>
      </Card>
    </div>
  )
}
