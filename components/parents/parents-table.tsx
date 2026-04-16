import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye, Edit, UserCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DeleteConfirm } from "@/components/ui/delete-confirm"
import { TableEmptyState } from "@/components/ui/table-empty-state"

interface ParentsTableProps {
  data: {
    id: string;
    name: string;
    email: string;
    phone: string;
    relationship: string | null;
    avatar?: string | null;
    students?: { name: string }[];
  }[]
}

export function ParentsTable({ data }: ParentsTableProps) {
  if (data.length === 0) {
    return (
      <TableEmptyState
        icon={UserCircle}
        title="No parents found"
        description="No parents match your current filters. Try adjusting the search or add a new parent."
        addHref="/parents/new"
        addLabel="Add Parent"
      />
    )
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Children/Ward</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Relation</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((parent) => (
            <TableRow key={parent.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={parent.avatar ?? undefined} alt={parent.name} />
                    <AvatarFallback>
                      {parent.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{parent.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">…{parent.id.slice(-6)}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-sm">{parent.email}</TableCell>
              <TableCell className="text-sm">
                {parent.students && parent.students.length > 0
                  ? parent.students.map((s) => s.name).join(", ")
                  : "—"}
              </TableCell>
              <TableCell>{parent.phone}</TableCell>
              <TableCell>{parent.relationship ?? "—"}</TableCell>
              <TableCell>
                <Badge className="bg-green-100 text-green-700">Active</Badge>
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
                      name={parent.name}
                      onConfirm={() => {
                        // TODO: wire to deleteParent server action
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
