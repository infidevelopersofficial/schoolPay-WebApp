import { getAnnouncement } from "@/lib/dal/announcements"
import { notFound } from "next/navigation"
import { NewAnnouncementForm } from "@/components/forms/new-announcement-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function EditAnnouncementPage({ params }: { params: { id: string } }) {
  const announcement = await getAnnouncement(params.id)

  if (!announcement) {
    notFound()
  }

  const initialData = {
    id: announcement.id,
    title: announcement.title,
    content: announcement.content,
    category: announcement.category,
    priority: announcement.priority,
    targetAudience: announcement.targetAudience,
    expiryDate: announcement.expiryDate || "",
  }

  return (
    <div className="max-w-3xl mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Announcement</CardTitle>
        </CardHeader>
        <CardContent>
          <NewAnnouncementForm 
            mode="edit" 
            initialData={initialData}
            open={true} 
            onOpenChange={() => {}} 
          />
        </CardContent>
      </Card>
    </div>
  )
}
