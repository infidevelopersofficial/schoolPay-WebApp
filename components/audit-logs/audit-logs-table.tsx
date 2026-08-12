"use client"

import { useState, Fragment } from "react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

interface AuditLogsTableProps {
  logs: any[]
  total: number
  totalPages: number
  currentPage: number
  searchParams: Record<string, string | undefined>
}

function safeStringify(value: any) {
  if (value === null || value === undefined) return "—"
  try {
    if (typeof value === "string") {
      // It might already be a JSON string
      const parsed = JSON.parse(value)
      return JSON.stringify(parsed, null, 2)
    }
    return JSON.stringify(value, null, 2)
  } catch (e) {
    // If it fails to parse/stringify, just return it as a string
    return String(value)
  }
}

function getActionColor(action: string) {
  switch (action) {
    case "CREATE":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
    case "UPDATE":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
    case "DELETE":
    case "SOFT_DELETE":
    case "HARD_DELETE":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
    case "REFUND":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  }
}

export function AuditLogsTable({ logs, total, totalPages, currentPage, searchParams }: AuditLogsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const createPageUrl = (page: number) => {
    const parts: string[] = []
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) {
        parts.push(`${key}=${encodeURIComponent(value)}`)
      }
    })
    parts.push(`page=${page}`)
    return `/dashboard/audit-logs?${parts.join("&")}`
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left font-medium">
              <th className="p-4 w-10"></th>
              <th className="p-4">Timestamp</th>
              <th className="p-4">Action</th>
              <th className="p-4">Entity Type</th>
              <th className="p-4">Entity ID</th>
              <th className="p-4">Description</th>
              <th className="p-4">User</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No audit logs found matching the filters.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const isExpanded = expandedRows.has(log.id)
                return (
                  <Fragment key={log.id}>
                    <tr 
                      className={`border-b hover:bg-muted/30 cursor-pointer transition-colors ${isExpanded ? "bg-muted/10" : ""}`}
                      onClick={() => toggleRow(log.id)}
                    >
                      <td className="p-4">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={`font-semibold ${getActionColor(log.action)} border-0`}>
                          {log.action}
                        </Badge>
                      </td>
                      <td className="p-4 font-medium">{log.entityType}</td>
                      <td className="p-4 font-mono text-muted-foreground">
                        {log.entityId.slice(0, 8)}...
                      </td>
                      <td className="p-4">{log.description || "—"}</td>
                      <td className="p-4 text-muted-foreground">
                        {log.user?.name || log.userEmail || "System"}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-b bg-muted/5">
                        <td colSpan={7} className="p-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Previous State</h4>
                              <div className="bg-card border rounded-md p-4 overflow-x-auto">
                                <pre className="text-xs font-mono text-foreground/80">
                                  {safeStringify(log.oldValues)}
                                </pre>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2 text-sm text-muted-foreground">New State</h4>
                              <div className="bg-card border rounded-md p-4 overflow-x-auto">
                                <pre className="text-xs font-mono text-foreground/80">
                                  {safeStringify(log.newValues)}
                                </pre>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="text-sm text-muted-foreground">
            Showing page {currentPage} of {totalPages} ({total} total records)
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              asChild={currentPage > 1}
            >
              {currentPage > 1 ? (
                <Link href={createPageUrl(currentPage - 1)}>Previous</Link>
              ) : (
                <span>Previous</span>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              asChild={currentPage < totalPages}
            >
              {currentPage < totalPages ? (
                <Link href={createPageUrl(currentPage + 1)}>Next</Link>
              ) : (
                <span>Next</span>
              )}
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
