import { getAnnouncements } from "@/lib/dal/announcements"
import { AnnouncementsClient } from "@/components/announcements/announcements-client"

export default async function AnnouncementsPage() {
  const data = await getAnnouncements()

  return <AnnouncementsClient initialData={data} />
}
