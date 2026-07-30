import { getClass } from "@/lib/dal/classes"
import { getTeachers } from "@/lib/dal/teachers"
import { notFound } from "next/navigation"
import { AddClassForm } from "@/components/forms/add-class-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function EditClassPage({ params }: { params: { id: string } }) {
  const cls = await getClass(params.id)

  if (!cls) {
    notFound()
  }

  // Fetch teachers for the dropdown
  const { teachers } = await getTeachers({ limit: 500 })

  const initialData = {
    id: cls.id,
    name: cls.name,
    section: cls.section,
    classTeacherId: cls.classTeacherId || "",
    room: cls.room || "",
    capacity: cls.capacity.toString(),
  }

  return (
    <div className="max-w-3xl mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Class: {cls.name}-{cls.section}</CardTitle>
        </CardHeader>
        <CardContent>
          <AddClassForm 
            mode="edit" 
            initialData={initialData} 
            open={true} 
            onOpenChange={() => {}} 
            teachers={teachers}
          />
        </CardContent>
      </Card>
    </div>
  )
}
