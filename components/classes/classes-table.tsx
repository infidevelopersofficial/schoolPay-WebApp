"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DeleteConfirm } from "@/components/ui/delete-confirm"
import { DataTableExport } from "@/components/ui/data-table-export"
import { deleteClassAction } from "@/app/(dashboard)/dashboard/classes/actions"

interface ClassItem {
  id: string
  name: string
  section: string
  capacity: number
  room: string | null
  strength?: number
  classTeacher?: { name: string } | null
}

interface ClassesTableProps {
  data: ClassItem[]
}

export function ClassesTable({ data }: ClassesTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteClassAction(id)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Class deleted successfully")
        router.refresh()
      }
    })
  }

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
                <TableCell className="font-medium">{classItem.strength ?? 0}</TableCell>
                <TableCell>{classItem.capacity}</TableCell>
                <TableCell>{classItem.room ?? "—"}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isPending}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => router.push(`/dashboard/classes/${classItem.id}/edit`)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DeleteConfirm
                        name={`${classItem.name} - ${classItem.section}`}
                        onConfirm={() => handleDelete(classItem.id)}
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
