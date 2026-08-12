"use client"

import { useTransition } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { DataTableExport } from "@/components/ui/data-table-export"
import { DeleteConfirm } from "@/components/ui/delete-confirm"
import { deleteTimetableAction } from "@/app/(dashboard)/dashboard/timetable/actions"
import { toast } from "sonner"

interface TimetablesTableProps {
  data: {
    id: string
    isActive: boolean
    class: { name: string; section: string }
    session: { name: string }
    createdAt: Date
  }[]
}

export function TimetablesTable({ data }: TimetablesTableProps) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteTimetableAction(id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Timetable deleted successfully")
      }
    })
  }

  return (
    <Card>
      <div className="p-4 flex justify-end items-center border-b">
        <DataTableExport 
          filename="Timetables_Export" 
          data={data} 
          columns={[
          { header: "Class", key: (r) => `${r.class.name} ${r.class.section}` },
          { header: "Academic Session", key: (r) => r.session.name },
          { header: "Status", key: (r) => r.isActive ? "Active" : "Inactive" }
        ]} 
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Class</TableHead>
            <TableHead>Academic Session</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                No timetables found. Click &quot;New Timetable&quot; to create one.
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{item.class.name}</p>
                    <p className="text-xs text-muted-foreground">{item.class.section}</p>
                  </div>
                </TableCell>
                <TableCell>{item.session.name}</TableCell>
                <TableCell>
                  {item.isActive ? (
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Row actions">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/timetable/${item.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DeleteConfirm 
                        name={`Timetable for ${item.class.name} ${item.class.section}`} 
                        onConfirm={() => handleDelete(item.id)} 
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  )
}
