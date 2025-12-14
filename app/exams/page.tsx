import { DashboardLayout } from "@/components/layout/dashboard-layout"
<<<<<<< HEAD
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const exams = [
  { id: 1, name: "Math Midterm", class: "Grade 9", date: "2025-02-10", maxMarks: 100, status: "scheduled" },
  { id: 2, name: "English Finals", class: "Grade 10", date: "2025-02-15", maxMarks: 80, status: "scheduled" },
  { id: 3, name: "Science Practical", class: "Grade 11", date: "2025-02-20", maxMarks: 50, status: "scheduled" },
=======
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter, MoreHorizontal, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const exams = [
  {
    id: "EXM001",
    name: "Mathematics Midterm",
    subject: "Mathematics",
    class: "Grade 9",
    date: "2025-02-10",
    time: "09:00 AM",
    duration: "2 hours",
    maxMarks: 100,
    status: "scheduled",
  },
  {
    id: "EXM002",
    name: "English Finals",
    subject: "English",
    class: "Grade 10",
    date: "2025-02-15",
    time: "10:00 AM",
    duration: "2.5 hours",
    maxMarks: 100,
    status: "scheduled",
  },
  {
    id: "EXM003",
    name: "Science Practical",
    subject: "Science",
    class: "Grade 11",
    date: "2025-02-20",
    time: "02:00 PM",
    duration: "1.5 hours",
    maxMarks: 50,
    status: "scheduled",
  },
  {
    id: "EXM004",
    name: "History Term Test",
    subject: "History",
    class: "Grade 10",
    date: "2025-01-20",
    time: "09:30 AM",
    duration: "1.5 hours",
    maxMarks: 75,
    status: "completed",
  },
  {
    id: "EXM005",
    name: "Physics Lab Exam",
    subject: "Physics",
    class: "Grade 11",
    date: "2025-01-18",
    time: "11:00 AM",
    duration: "2 hours",
    maxMarks: 50,
    status: "completed",
  },
  {
    id: "EXM006",
    name: "Computer Science Project",
    subject: "Computer Science",
    class: "Grade 10",
    date: "2025-02-25",
    time: "10:00 AM",
    duration: "3 hours",
    maxMarks: 100,
    status: "scheduled",
  },
]

const statusColors = {
  scheduled: "bg-blue-100 text-blue-700",
  ongoing: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
}

const stats = [
  { label: "Total Exams", value: "24", change: "This semester" },
  { label: "Upcoming", value: "8", change: "Next 30 days" },
  { label: "Completed", value: "16", change: "This semester" },
  { label: "Average Pass Rate", value: "87%", change: "+3% from last" },
>>>>>>> master
]

export default function ExamsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Examinations</h1>
            <p className="text-sm text-muted-foreground">Schedule and manage exams</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
<<<<<<< HEAD
            New Exam
          </Button>
        </div>

=======
            Schedule Exam
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

>>>>>>> master
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search exams..." className="pl-10" />
          </div>
<<<<<<< HEAD
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map((exam) => (
            <Card key={exam.id}>
              <CardHeader>
                <CardTitle className="text-base">{exam.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Class:</span> {exam.class}
                </p>
                <p>
                  <span className="text-muted-foreground">Date:</span> {exam.date}
                </p>
                <p>
                  <span className="text-muted-foreground">Max Marks:</span> {exam.maxMarks}
                </p>
                <Badge className="w-fit bg-green-100 text-green-700">{exam.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
=======
          <Button variant="outline" className="gap-2 bg-transparent">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Exams</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Max Marks</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">{exam.name}</TableCell>
                      <TableCell>{exam.subject}</TableCell>
                      <TableCell>{exam.class}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{exam.date}</span>
                          <span className="text-xs text-muted-foreground">{exam.time}</span>
                        </div>
                      </TableCell>
                      <TableCell>{exam.duration}</TableCell>
                      <TableCell>{exam.maxMarks}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[exam.status as keyof typeof statusColors]}>{exam.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>View Results</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Cancel</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="upcoming">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Max Marks</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams
                    .filter((e) => e.status === "scheduled")
                    .map((exam) => (
                      <TableRow key={exam.id}>
                        <TableCell className="font-medium">{exam.name}</TableCell>
                        <TableCell>{exam.subject}</TableCell>
                        <TableCell>{exam.class}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{exam.date}</span>
                            <span className="text-xs text-muted-foreground">{exam.time}</span>
                          </div>
                        </TableCell>
                        <TableCell>{exam.duration}</TableCell>
                        <TableCell>{exam.maxMarks}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exam Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Max Marks</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams
                    .filter((e) => e.status === "completed")
                    .map((exam) => (
                      <TableRow key={exam.id}>
                        <TableCell className="font-medium">{exam.name}</TableCell>
                        <TableCell>{exam.subject}</TableCell>
                        <TableCell>{exam.class}</TableCell>
                        <TableCell>{exam.date}</TableCell>
                        <TableCell>{exam.maxMarks}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            View Results
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
>>>>>>> master
      </div>
    </DashboardLayout>
  )
}
