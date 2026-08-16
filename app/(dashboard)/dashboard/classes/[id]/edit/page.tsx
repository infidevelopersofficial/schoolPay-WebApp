import { getClass } from "@/lib/dal/classes"
import { notFound } from "next/navigation"
import { EditClassForm } from "@/components/classes/edit-class-form"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cls = await getClass(id)
  return { title: cls ? `Edit ${cls.name}-${cls.section} | SchoolPay` : "Edit Class | SchoolPay" }
}

export default async function EditClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cls = await getClass(id)

  if (!cls) notFound()

  // Only prefetch the currently assigned teacher so the combobox can show it
  let defaultTeachers: { id: string; name: string; email?: string }[] = []
  if (cls.classTeacherId) {
    const { getTeacher } = await import("@/lib/dal/teachers")
    const teacher = await getTeacher(cls.classTeacherId)
    if (teacher) defaultTeachers = [{ id: teacher.id, name: teacher.name, email: teacher.email ?? undefined }]
  }

  return (
    <EditClassForm
      initialData={{
        id: cls.id,
        name: cls.name,
        section: cls.section,
        classTeacherId: cls.classTeacherId || "",
        room: cls.room || "",
        capacity: String(cls.capacity),
      }}
      defaultTeachers={defaultTeachers}
    />
  )
}
