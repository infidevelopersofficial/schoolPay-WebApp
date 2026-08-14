import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Class } from "@prisma/client"
import Link from "next/link"
import { DataTableExport } from "@/components/ui/data-table-export"

interface ClassesTableProps {
  data: (Class & { classTeacher?: { name: string } | null })[]
}

export function ClassesTable({ data }: ClassesTableProps) {
  // Pre-resolve nested data into plain strings for the client-side DataTableExport.
  // Functions cannot be serialized across the server/client boundary.
  const exportData = data.map((c) => ({
    name: c.name,
    section: c.section,
    classTeacher: c.classTeacher?.name || "",
    capacity: String(c.capacity),
    room: c.room || "",
  }))
  const exportColumns = [
    { header: "Name", key: "name" },
    { header: "Section", key: "section" },
    { header: "Class Teacher", key: "classTeacher" },
    { header: "Capacity", key: "capacity" },
    { header: "Room", key: "room" },
  ]

  return (
    <Card>
      <div className="p-4 flex justify-end items-center border-b">
        <DataTableExport
          filename="Classes_Export"
          data={exportData}
          columns={exportColumns}
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Class</TableHead>
            <TableHead>Class Teacher</TableHead>
            <TableHead>Students</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Room</TableHead>
            <TableHead className="w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No classes found. Click &quot;Add Class&quot; to create one.
              </TableCell>
            </TableRow>
          ) : (
            data.map((classItem) => (
              <TableRow key={classItem.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{classItem.name}</p>
                    <p className="text-xs text-muted-foreground">{classItem.section}</p>
                  </div>
                </TableCell>
                <TableCell>{classItem.classTeacher?.name ?? "—"}</TableCell>
                <TableCell className="font-medium">{(classItem as any).strength}</TableCell>
                <TableCell>{classItem.capacity}</TableCell>
                <TableCell>{classItem.room ?? "—"}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <Link href={`/dashboard/classes/${classItem.id}/edit`}>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
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
