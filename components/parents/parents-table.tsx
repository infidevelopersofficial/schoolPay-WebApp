"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const parents = [
  {
    id: "PAR001",
    name: "Robert Smith",
    email: "robert.smith@email.com",
    children: "John Smith, Lisa Smith",
    phone: "+1 234 567 890",
    relation: "Father",
    status: "active",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "PAR002",
    name: "Mary Johnson",
    email: "mary.j@email.com",
    children: "Sarah Johnson",
    phone: "+1 234 567 891",
    relation: "Mother",
    status: "active",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "PAR003",
    name: "James Brown",
    email: "james.b@email.com",
    children: "Michael Brown, Grace Brown",
    phone: "+1 234 567 892",
    relation: "Father",
    status: "active",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "PAR004",
    name: "Susan Miller",
    email: "susan.m@email.com",
    children: "Emily Davis",
    phone: "+1 234 567 893",
    relation: "Guardian",
    status: "inactive",
    avatar: "/placeholder.svg?height=40&width=40",
  },
]

const statusColors = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-700",
}

export function ParentsTable() {
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
          {parents.map((parent) => (
            <TableRow key={parent.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={parent.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {parent.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{parent.name}</p>
                    <p className="text-xs text-muted-foreground">{parent.id}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>{parent.email}</TableCell>
              <TableCell className="text-sm">{parent.children}</TableCell>
              <TableCell>{parent.phone}</TableCell>
              <TableCell>{parent.relation}</TableCell>
              <TableCell>
                <Badge className={statusColors[parent.status as keyof typeof statusColors]}>{parent.status}</Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
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
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
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
