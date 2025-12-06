"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const teachers = [
  {
    id: "TCH001",
    name: "Dr. James Wilson",
    email: "james.w@school.com",
    subject: "Mathematics",
    classes: "Grade 10A, 10B",
    phone: "+1 234 567 890",
    status: "active",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "TCH002",
    name: "Ms. Sarah Anderson",
    email: "s.anderson@school.com",
    subject: "English Literature",
    classes: "Grade 9A, 11A",
    phone: "+1 234 567 891",
    status: "active",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "TCH003",
    name: "Mr. Robert Kumar",
    email: "r.kumar@school.com",
    subject: "Science",
    classes: "Grade 8A, 8B, 9B",
    phone: "+1 234 567 892",
    status: "active",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "TCH004",
    name: "Ms. Emma Davis",
    email: "e.davis@school.com",
    subject: "History",
    classes: "Grade 11B, 12A",
    phone: "+1 234 567 893",
    status: "on-leave",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "TCH005",
    name: "Mr. Michael Chen",
    email: "m.chen@school.com",
    subject: "Computer Science",
    classes: "Grade 10A, 11A, 12A",
    phone: "+1 234 567 894",
    status: "active",
    avatar: "/placeholder.svg?height=40&width=40",
  },
]

const statusColors = {
  active: "bg-green-100 text-green-700",
  "on-leave": "bg-yellow-100 text-yellow-700",
  inactive: "bg-gray-100 text-gray-700",
}

export function TeachersTable() {
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
          {teachers.map((teacher) => (
            <TableRow key={teacher.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={teacher.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {teacher.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{teacher.name}</p>
                    <p className="text-xs text-muted-foreground">{teacher.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm">{teacher.id}</TableCell>
              <TableCell>{teacher.subject}</TableCell>
              <TableCell className="text-sm">{teacher.classes}</TableCell>
              <TableCell>{teacher.phone}</TableCell>
              <TableCell>
                <Badge className={statusColors[teacher.status as keyof typeof statusColors]}>{teacher.status}</Badge>
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
