import { DashboardLayout } from "@/components/layout/dashboard-layout"
<<<<<<< HEAD
import { Card } from "@/components/ui/card"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const results = [
  { id: 1, student: "John Smith", class: "Grade 10A", exam: "Math Midterm", marks: 92, maxMarks: 100, grade: "A+" },
  { id: 2, student: "Sarah Johnson", class: "Grade 10B", exam: "English Finals", marks: 78, maxMarks: 80, grade: "A" },
  { id: 3, student: "Michael Brown", class: "Grade 9A", exam: "Science Test", marks: 65, maxMarks: 100, grade: "B" },
  { id: 4, student: "Emily Davis", class: "Grade 11A", exam: "History Exam", marks: 55, maxMarks: 100, grade: "C" },
=======
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Filter, Download, MoreHorizontal, Eye, FileText, Upload } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const results = [
  {
    id: 1,
    student: "John Smith",
    studentId: "STU001",
    avatar: "/placeholder.svg?height=32&width=32",
    class: "Grade 10A",
    exam: "Math Midterm",
    marks: 92,
    maxMarks: 100,
    grade: "A+",
    percentage: 92,
    status: "published",
  },
  {
    id: 2,
    student: "Sarah Johnson",
    studentId: "STU002",
    avatar: "/placeholder.svg?height=32&width=32",
    class: "Grade 10B",
    exam: "English Finals",
    marks: 78,
    maxMarks: 80,
    grade: "A",
    percentage: 97.5,
    status: "published",
  },
  {
    id: 3,
    student: "Michael Brown",
    studentId: "STU003",
    avatar: "/placeholder.svg?height=32&width=32",
    class: "Grade 9A",
    exam: "Science Test",
    marks: 65,
    maxMarks: 100,
    grade: "B",
    percentage: 65,
    status: "published",
  },
  {
    id: 4,
    student: "Emily Davis",
    studentId: "STU004",
    avatar: "/placeholder.svg?height=32&width=32",
    class: "Grade 11A",
    exam: "History Exam",
    marks: 55,
    maxMarks: 100,
    grade: "C",
    percentage: 55,
    status: "published",
  },
  {
    id: 5,
    student: "David Wilson",
    studentId: "STU005",
    avatar: "/placeholder.svg?height=32&width=32",
    class: "Grade 10A",
    exam: "Math Midterm",
    marks: 88,
    maxMarks: 100,
    grade: "A",
    percentage: 88,
    status: "published",
  },
  {
    id: 6,
    student: "Lisa Anderson",
    studentId: "STU006",
    avatar: "/placeholder.svg?height=32&width=32",
    class: "Grade 9B",
    exam: "Science Test",
    marks: 72,
    maxMarks: 100,
    grade: "B+",
    percentage: 72,
    status: "draft",
  },
  {
    id: 7,
    student: "James Taylor",
    studentId: "STU007",
    avatar: "/placeholder.svg?height=32&width=32",
    class: "Grade 11B",
    exam: "Physics Lab",
    marks: 45,
    maxMarks: 50,
    grade: "A",
    percentage: 90,
    status: "published",
  },
  {
    id: 8,
    student: "Emma Martinez",
    studentId: "STU008",
    avatar: "/placeholder.svg?height=32&width=32",
    class: "Grade 10B",
    exam: "English Finals",
    marks: 68,
    maxMarks: 80,
    grade: "B+",
    percentage: 85,
    status: "draft",
  },
]

const gradeColors: Record<string, string> = {
  "A+": "bg-green-100 text-green-700",
  A: "bg-green-100 text-green-700",
  "B+": "bg-blue-100 text-blue-700",
  B: "bg-blue-100 text-blue-700",
  "C+": "bg-yellow-100 text-yellow-700",
  C: "bg-yellow-100 text-yellow-700",
  D: "bg-orange-100 text-orange-700",
  F: "bg-red-100 text-red-700",
}

const stats = [
  { label: "Total Results", value: "1,234" },
  { label: "Published", value: "1,180" },
  { label: "Draft", value: "54" },
  { label: "Average Score", value: "76.5%" },
>>>>>>> master
]

export default function ResultsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
<<<<<<< HEAD
        <div>
          <h1 className="text-2xl font-bold text-foreground">Results</h1>
          <p className="text-sm text-muted-foreground">View and publish exam results</p>
        </div>

        <div className="flex items-center gap-4">
=======
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Results</h1>
            <p className="text-sm text-muted-foreground">View and publish exam results</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 bg-transparent">
              <Upload className="h-4 w-4" />
              Import Results
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
>>>>>>> master
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search results..." className="pl-10" />
          </div>
<<<<<<< HEAD
=======
          <Select defaultValue="all">
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select Exam" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Exams</SelectItem>
              <SelectItem value="math">Math Midterm</SelectItem>
              <SelectItem value="english">English Finals</SelectItem>
              <SelectItem value="science">Science Test</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              <SelectItem value="9a">Grade 9A</SelectItem>
              <SelectItem value="9b">Grade 9B</SelectItem>
              <SelectItem value="10a">Grade 10A</SelectItem>
              <SelectItem value="10b">Grade 10B</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Filter className="h-4 w-4" />
            More Filters
          </Button>
>>>>>>> master
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Exam</TableHead>
                <TableHead>Marks</TableHead>
<<<<<<< HEAD
                <TableHead>Grade</TableHead>
=======
                <TableHead>Percentage</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
>>>>>>> master
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result) => (
                <TableRow key={result.id}>
<<<<<<< HEAD
                  <TableCell className="font-medium">{result.student}</TableCell>
                  <TableCell>{result.class}</TableCell>
                  <TableCell>{result.exam}</TableCell>
                  <TableCell>
                    {result.marks}/{result.maxMarks}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-700">{result.grade}</Badge>
=======
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={result.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {result.student
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{result.student}</p>
                        <p className="text-xs text-muted-foreground">{result.studentId}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{result.class}</TableCell>
                  <TableCell>{result.exam}</TableCell>
                  <TableCell>
                    <span className="font-medium">{result.marks}</span>
                    <span className="text-muted-foreground">/{result.maxMarks}</span>
                  </TableCell>
                  <TableCell>{result.percentage}%</TableCell>
                  <TableCell>
                    <Badge className={gradeColors[result.grade] || "bg-gray-100 text-gray-700"}>{result.grade}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={result.status === "published" ? "default" : "secondary"}>{result.status}</Badge>
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
                          <FileText className="h-4 w-4 mr-2" />
                          Generate Report
                        </DropdownMenuItem>
                        {result.status === "draft" && <DropdownMenuItem>Publish</DropdownMenuItem>}
                      </DropdownMenuContent>
                    </DropdownMenu>
>>>>>>> master
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
