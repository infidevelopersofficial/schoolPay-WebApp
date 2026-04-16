import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye, Edit, Users } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DeleteConfirm } from "@/components/ui/delete-confirm"
import { TableEmptyState } from "@/components/ui/table-empty-state"
import { DataTableSortHeader } from "@/components/ui/data-table/data-table-sort-header"
import Link from "next/link"

const statusColors = {
  PAID: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  OVERDUE: "bg-red-100 text-red-700",
  PARTIAL: "bg-orange-100 text-orange-700",
}

interface StudentsTableProps {
  data: {
    id: string;
    name: string;
    email: string;
    class: string;
    phone: string | null;
    feeStatus: string;
    avatar: string | null;
    parent?: { name: string } | null;
  }[]
}

export function StudentsTable({ data }: StudentsTableProps) {
  if (data.length === 0) {
    return (
      <TableEmptyState
        icon={Users}
        title="No students found"
        description="No students match your current filters. Try adjusting the search or add a new student."
        addHref="/students/new"
        addLabel="Add Student"
      />
    )
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><DataTableSortHeader label="Student" sortKey="name" /></TableHead>
            <TableHead>ID</TableHead>
            <TableHead><DataTableSortHeader label="Class" sortKey="class" /></TableHead>
            <TableHead>Parent/Guardian</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead><DataTableSortHeader label="Fee Status" sortKey="feeStatus" /></TableHead>
            <TableHead className="w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((student) => (
            <TableRow key={student.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={student.avatar ?? undefined} alt={student.name} />
                    <AvatarFallback>
                      {student.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">…{student.id.slice(-6)}</TableCell>
              <TableCell>{student.class}</TableCell>
              <TableCell>{student.parent?.name ?? "—"}</TableCell>
              <TableCell>{student.phone ?? "—"}</TableCell>
              <TableCell>
                <Badge className={statusColors[student.feeStatus as keyof typeof statusColors] ?? "bg-gray-100 text-gray-700"}>
                  {student.feeStatus}
                </Badge>
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
                      <Link href={`/students/${student.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DeleteConfirm
                      name={student.name}
                      onConfirm={() => {
                        // TODO: wire to deleteStudent server action
                      }}
                    />
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
