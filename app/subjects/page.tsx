import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter, Download, MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const subjects = [
  {
    id: "SUB001",
    name: "Mathematics",
    code: "MAT101",
    teacher: "Dr. James Wilson",
    classes: 4,
    students: 120,
    status: "active",
  },
  {
    id: "SUB002",
    name: "English Literature",
    code: "ENG101",
    teacher: "Ms. Sarah Anderson",
    classes: 3,
    students: 90,
    status: "active",
  },
  {
    id: "SUB003",
    name: "Science",
    code: "SCI101",
    teacher: "Mr. Robert Kumar",
    classes: 4,
    students: 125,
    status: "active",
  },
  {
    id: "SUB004",
    name: "History",
    code: "HIS101",
    teacher: "Ms. Emma Davis",
    classes: 2,
    students: 65,
    status: "active",
  },
  {
    id: "SUB005",
    name: "Computer Science",
    code: "CS101",
    teacher: "Mr. Michael Chen",
    classes: 3,
    students: 95,
    status: "active",
  },
  {
    id: "SUB006",
    name: "Physics",
    code: "PHY101",
    teacher: "Dr. Lisa Park",
    classes: 3,
    students: 88,
    status: "active",
  },
  {
    id: "SUB007",
    name: "Chemistry",
    code: "CHM101",
    teacher: "Mr. David Lee",
    classes: 3,
    students: 85,
    status: "active",
  },
  {
    id: "SUB008",
    name: "Art & Design",
    code: "ART101",
    teacher: "Ms. Jennifer White",
    classes: 2,
    students: 45,
    status: "inactive",
  },
]

export default function SubjectsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Subjects</h1>
            <p className="text-sm text-muted-foreground">Manage school subjects and curricula</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Subject
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search subjects..." className="pl-10" />
          </div>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Classes</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell className="font-medium">{subject.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {subject.code}
                    </Badge>
                  </TableCell>
                  <TableCell>{subject.teacher}</TableCell>
                  <TableCell>{subject.classes}</TableCell>
                  <TableCell>{subject.students}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        subject.status === "active"
                          ? "bg-green-100 text-green-700 hover:bg-green-100"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                      }
                    >
                      {subject.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
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
      </div>
    </DashboardLayout>
  )
}
