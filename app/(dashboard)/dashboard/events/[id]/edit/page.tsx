import { getEvent } from "@/lib/dal/events"
import { notFound } from "next/navigation"
import { CreateEventForm } from "@/components/forms/create-event-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function EditEventPage({ params }: { params: { id: string } }) {
  const event = await getEvent(params.id)

  if (!event) {
    notFound()
  }

  const initialData = {
    id: event.id,
    name: event.name,
    date: event.date,
    time: event.time || "",
    location: event.location,
    type: event.type,
    description: event.description || "",
    status: event.status,
  }

  return (
    <div className="max-w-3xl mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Event: {event.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateEventForm 
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
