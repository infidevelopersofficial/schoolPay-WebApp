import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye, Edit, GraduationCap } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DeleteConfirm } from "@/components/ui/delete-confirm"
import { TableEmptyState } from "@/components/ui/table-empty-state"

const statusColors = {
  active: "bg-green-100 text-green-700",
  "on-leave": "bg-yellow-100 text-yellow-700",
  inactive: "bg-gray-100 text-gray-700",
}

interface TeachersTableProps {
  data: {
    id: string;
    name: string;
    email: string;
    subject: string;
    class: string;
    phone: string | null;
    avatar: string | null;
    isActive: boolean;
  }[]
}

export function TeachersTable({ data }: TeachersTableProps) {
  if (data.length === 0) {
    return (
      <TableEmptyState
        icon={GraduationCap}
        title="No teachers found"
        description="No teachers match your current filters. Try adjusting the search or add a new teacher."
        addHref="/teachers/new"
        addLabel="Add Teacher"
      />
    )
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Teacher</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Classes</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((teacher) => (
            <TableRow key={teacher.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={teacher.avatar ?? undefined} alt={teacher.name} />
                    <AvatarFallback>
                      {teacher.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{teacher.name}</p>
                    <p className="text-xs text-muted-foreground">{teacher.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">…{teacher.id.slice(-6)}</TableCell>
              <TableCell>{teacher.subject}</TableCell>
              <TableCell className="text-sm">{teacher.class}</TableCell>
              <TableCell>{teacher.phone ?? "—"}</TableCell>
              <TableCell>
                <Badge className={teacher.isActive ? statusColors.active : statusColors.inactive}>
                  {teacher.isActive ? "Active" : "Inactive"}
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
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DeleteConfirm
                      name={teacher.name}
                      onConfirm={() => {
                        // TODO: wire to deleteTeacher server action
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
