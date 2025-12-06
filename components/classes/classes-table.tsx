"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const classes = [
  {
    id: "CLS001",
    name: "Grade 8A",
    section: "A",
    classTeacher: "Mr. Robert Kumar",
    students: 32,
    capacity: 35,
    room: "Room 101",
    status: "active",
  },
  {
    id: "CLS002",
    name: "Grade 8B",
    section: "B",
    classTeacher: "Ms. Emma Davis",
    students: 30,
    capacity: 35,
    room: "Room 102",
    status: "active",
  },
  {
    id: "CLS003",
    name: "Grade 9A",
    section: "A",
    classTeacher: "Dr. James Wilson",
    students: 34,
    capacity: 35,
    room: "Room 201",
    status: "active",
  },
  {
    id: "CLS004",
    name: "Grade 10A",
    section: "A",
    classTeacher: "Mr. Michael Chen",
    students: 28,
    capacity: 35,
    room: "Room 301",
    status: "active",
  },
  {
    id: "CLS005",
    name: "Grade 11A",
    section: "A",
    classTeacher: "Ms. Sarah Anderson",
    students: 25,
    capacity: 30,
    room: "Room 401",
    status: "active",
  },
  {
    id: "CLS006",
    name: "Grade 12A",
    section: "A",
    classTeacher: "Dr. James Wilson",
    students: 22,
    capacity: 30,
    room: "Room 501",
    status: "active",
  },
]

export function ClassesTable() {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Class</TableHead>
            <TableHead>Class Teacher</TableHead>
            <TableHead>Students</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Room</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.map((classItem) => (
            <TableRow key={classItem.id}>
              <TableCell>
                <div>
                  <p className="font-medium text-foreground">{classItem.name}</p>
                  <p className="text-xs text-muted-foreground">{classItem.id}</p>
                </div>
              </TableCell>
              <TableCell>{classItem.classTeacher}</TableCell>
              <TableCell className="font-medium">{classItem.students}</TableCell>
              <TableCell>{classItem.capacity}</TableCell>
              <TableCell>{classItem.room}</TableCell>
              <TableCell>
                <Badge className="bg-green-100 text-green-700">{classItem.status}</Badge>
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
