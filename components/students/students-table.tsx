"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

const students = [
  {
    id: "STU001",
    name: "John Smith",
    email: "john.smith@school.com",
    class: "Grade 10A",
    parent: "Robert Smith",
    phone: "+1 234 567 890",
    feeStatus: "paid",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "STU002",
    name: "Sarah Johnson",
    email: "sarah.j@school.com",
    class: "Grade 10B",
    parent: "Mary Johnson",
    phone: "+1 234 567 891",
    feeStatus: "pending",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "STU003",
    name: "Michael Brown",
    email: "m.brown@school.com",
    class: "Grade 9A",
    parent: "James Brown",
    phone: "+1 234 567 892",
    feeStatus: "paid",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "STU004",
    name: "Emily Davis",
    email: "emily.d@school.com",
    class: "Grade 11A",
    parent: "David Davis",
    phone: "+1 234 567 893",
    feeStatus: "overdue",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "STU005",
    name: "Daniel Wilson",
    email: "d.wilson@school.com",
    class: "Grade 8B",
    parent: "Susan Wilson",
    phone: "+1 234 567 894",
    feeStatus: "paid",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "STU006",
    name: "Sophia Martinez",
    email: "sophia.m@school.com",
    class: "Grade 12A",
    parent: "Carlos Martinez",
    phone: "+1 234 567 895",
    feeStatus: "pending",
    avatar: "/placeholder.svg?height=40&width=40",
  },
]

const statusColors = {
  paid: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  overdue: "bg-red-100 text-red-700",
}

export function StudentsTable() {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Parent/Guardian</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Fee Status</TableHead>
            <TableHead className="w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={student.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {student.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm">{student.id}</TableCell>
              <TableCell>{student.class}</TableCell>
              <TableCell>{student.parent}</TableCell>
              <TableCell>{student.phone}</TableCell>
              <TableCell>
                <Badge className={statusColors[student.feeStatus as keyof typeof statusColors]}>
                  {student.feeStatus}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
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
