import { getAuditLogsAction } from "./actions"
import { AuditLogsTable } from "@/components/audit-logs/audit-logs-table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const ENTITY_TYPES = [
  "STUDENT", "TEACHER", "PARENT", "CLASS", "SUBJECT", 
  "PAYMENT", "FEE", "FEE_STRUCTURE", "EXAM", "RESULT", 
  "ATTENDANCE", "LESSON", "EVENT", "MESSAGE", "ANNOUNCEMENT", 
  "SCHOOL", "EXAM_GROUP", "GRADING_SCHEME", "COMMUNICATION_CAMPAIGN", 
  "SURVEY", "SURVEY_RESPONSE", "TIMETABLE", "TIMETABLE_PERIOD"
]

const ACTIONS = [
  "CREATE", "UPDATE", "SOFT_DELETE", "HARD_DELETE", "DELETE", "REFUND"
]

export default async function AuditLogsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams
  
  const page = typeof searchParams.page === "string" ? parseInt(searchParams.page, 10) : 1
  const limit = typeof searchParams.limit === "string" ? parseInt(searchParams.limit, 10) : 25
  const entityType = typeof searchParams.entityType === "string" ? searchParams.entityType : undefined
  const action = typeof searchParams.action === "string" ? searchParams.action : undefined
  const dateFrom = typeof searchParams.dateFrom === "string" ? searchParams.dateFrom : undefined
  const dateTo = typeof searchParams.dateTo === "string" ? searchParams.dateTo : undefined
  const userEmail = typeof searchParams.userEmail === "string" ? searchParams.userEmail : undefined

  const result = await getAuditLogsAction({
    page,
    limit,
    entityType,
    action,
    dateFrom,
    dateTo,
    userEmail
  })

  // getAuditLogsAction returns either { logs, total, totalPages, page } OR an error like { error: "..." }
  // Since it's wrapped in withTenantAuth, it could also return an error if unauthorized.
  if ("error" in result) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-destructive mb-4">Error</h1>
        <p>{String(result.error)}</p>
      </div>
    )
  }

  const { logs, total, totalPages, page: currentPage } = result

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">View system activity and changes.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter the audit trail by entity, action, or date.</CardDescription>
        </CardHeader>
        <CardContent>
          <form method="GET" className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="entityType">Entity Type</Label>
              <Select name="entityType" defaultValue={entityType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Entities</SelectItem>
                  {ENTITY_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Select name="action" defaultValue={action}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Actions</SelectItem>
                  {ACTIONS.map(act => (
                    <SelectItem key={act} value={act}>{act}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFrom">Date From</Label>
              <Input type="date" id="dateFrom" name="dateFrom" defaultValue={dateFrom} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTo">Date To</Label>
              <Input type="date" id="dateTo" name="dateTo" defaultValue={dateTo} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userEmail">User Email</Label>
              <Input type="text" id="userEmail" name="userEmail" defaultValue={userEmail} placeholder="admin@school.com" />
            </div>

            <div className="flex space-x-2">
              <Button type="submit" className="w-full">Apply</Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/dashboard/audit-logs">Clear</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <AuditLogsTable 
        logs={logs} 
        total={total} 
        totalPages={totalPages} 
        currentPage={currentPage}
        searchParams={{
          entityType,
          action,
          dateFrom,
          dateTo,
          userEmail,
          limit: limit.toString()
        }}
      />
    </div>
  )
}
