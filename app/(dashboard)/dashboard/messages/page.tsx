import { Suspense } from "react"
import { getMessages } from "@/lib/dal/messages"
import { MessagesContent } from "@/components/messages/messages-content"
import { MessagesPageClient } from "@/components/messages/messages-page-client"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { auth } from "@/lib/auth"

export const metadata = { title: "Messages | SchoolPay" }

export default async function MessagesPage(props: {
  searchParams?: Promise<{ query?: string }>
}) {
  const searchParams = await props.searchParams
  const query = searchParams?.query || ""
  const session = await auth()
  const currentUserEmail = session?.user?.email || ""

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Messages</h1>
          <p className="text-sm text-muted-foreground">Internal communication and announcements</p>
        </div>
        <MessagesPageClient />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search messages..." className="pl-10" />
      </div>

      <Suspense key={query} fallback={<TableSkeleton />}>
        <MessageDataFetcher search={query} currentUserEmail={currentUserEmail} />
      </Suspense>
    </div>
  )
}

async function MessageDataFetcher({ search, currentUserEmail }: { search: string, currentUserEmail: string }) {
  let messages = await getMessages({ email: currentUserEmail })

  if (search) {
    const lowerSearch = search.toLowerCase()
    messages = messages.filter(m => 
      m.subject.toLowerCase().includes(lowerSearch) || 
      m.body.toLowerCase().includes(lowerSearch) ||
      m.from.toLowerCase().includes(lowerSearch) ||
      m.toEmail.toLowerCase().includes(lowerSearch) ||
      m.fromEmail.toLowerCase().includes(lowerSearch)
    )
  }

  return <MessagesContent messages={messages} currentUserEmail={currentUserEmail} />
}
