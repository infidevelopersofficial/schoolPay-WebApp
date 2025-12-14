import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
<<<<<<< HEAD
import { Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const lessons = [
  { id: 1, title: "Algebra Basics", subject: "Mathematics", class: "Grade 9A", date: "2025-01-15", completed: true },
=======
import { Plus, Search, Filter, Calendar, Clock, Users, MoreHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const lessons = [
  {
    id: 1,
    title: "Algebra Basics",
    subject: "Mathematics",
    class: "Grade 9A",
    teacher: "Dr. James Wilson",
    date: "2025-01-15",
    time: "09:00 AM",
    duration: "45 min",
    status: "completed",
  },
>>>>>>> master
  {
    id: 2,
    title: "Shakespeare's Sonnets",
    subject: "English",
    class: "Grade 10B",
<<<<<<< HEAD
    date: "2025-01-16",
    completed: false,
  },
  { id: 3, title: "Cell Biology", subject: "Science", class: "Grade 9B", date: "2025-01-17", completed: true },
  { id: 4, title: "World War II", subject: "History", class: "Grade 11A", date: "2025-01-18", completed: false },
]

=======
    teacher: "Ms. Sarah Anderson",
    date: "2025-01-16",
    time: "10:30 AM",
    duration: "50 min",
    status: "scheduled",
  },
  {
    id: 3,
    title: "Cell Biology",
    subject: "Science",
    class: "Grade 9B",
    teacher: "Mr. Robert Kumar",
    date: "2025-01-17",
    time: "11:00 AM",
    duration: "45 min",
    status: "completed",
  },
  {
    id: 4,
    title: "World War II",
    subject: "History",
    class: "Grade 11A",
    teacher: "Ms. Emma Davis",
    date: "2025-01-18",
    time: "02:00 PM",
    duration: "60 min",
    status: "scheduled",
  },
  {
    id: 5,
    title: "Python Programming",
    subject: "Computer Science",
    class: "Grade 10A",
    teacher: "Mr. Michael Chen",
    date: "2025-01-19",
    time: "09:30 AM",
    duration: "90 min",
    status: "scheduled",
  },
  {
    id: 6,
    title: "Quadratic Equations",
    subject: "Mathematics",
    class: "Grade 10A",
    teacher: "Dr. James Wilson",
    date: "2025-01-20",
    time: "10:00 AM",
    duration: "45 min",
    status: "scheduled",
  },
  {
    id: 7,
    title: "Chemical Reactions",
    subject: "Chemistry",
    class: "Grade 11B",
    teacher: "Mr. David Lee",
    date: "2025-01-21",
    time: "01:00 PM",
    duration: "50 min",
    status: "cancelled",
  },
  {
    id: 8,
    title: "Newton's Laws",
    subject: "Physics",
    class: "Grade 10B",
    teacher: "Dr. Lisa Park",
    date: "2025-01-22",
    time: "11:30 AM",
    duration: "45 min",
    status: "scheduled",
  },
]

const statusColors = {
  completed: "bg-green-100 text-green-700",
  scheduled: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
  ongoing: "bg-yellow-100 text-yellow-700",
}

>>>>>>> master
export default function LessonsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Lessons</h1>
            <p className="text-sm text-muted-foreground">Manage and schedule lessons</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
<<<<<<< HEAD
            New Lesson
=======
            Schedule Lesson
>>>>>>> master
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search lessons..." className="pl-10" />
          </div>
<<<<<<< HEAD
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lessons.map((lesson) => (
            <Card key={lesson.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{lesson.title}</CardTitle>
                  <Badge variant={lesson.completed ? "default" : "secondary"}>
                    {lesson.completed ? "Completed" : "Pending"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Subject:</span> {lesson.subject}
                </p>
                <p>
                  <span className="text-muted-foreground">Class:</span> {lesson.class}
                </p>
                <p>
                  <span className="text-muted-foreground">Date:</span> {lesson.date}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
=======
          <Button variant="outline" className="gap-2 bg-transparent">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Lessons</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lessons.map((lesson) => (
                <Card key={lesson.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{lesson.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{lesson.subject}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Cancel</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{lesson.class}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{lesson.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {lesson.time} ({lesson.duration})
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-muted-foreground">{lesson.teacher}</span>
                      <Badge className={statusColors[lesson.status as keyof typeof statusColors]}>
                        {lesson.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="scheduled">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lessons
                .filter((l) => l.status === "scheduled")
                .map((lesson) => (
                  <Card key={lesson.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{lesson.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{lesson.subject}</p>
                        </div>
                        <Badge className={statusColors[lesson.status as keyof typeof statusColors]}>
                          {lesson.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{lesson.class}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{lesson.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {lesson.time} ({lesson.duration})
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lessons
                .filter((l) => l.status === "completed")
                .map((lesson) => (
                  <Card key={lesson.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{lesson.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{lesson.subject}</p>
                        </div>
                        <Badge className={statusColors[lesson.status as keyof typeof statusColors]}>
                          {lesson.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{lesson.class}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{lesson.date}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
>>>>>>> master
      </div>
    </DashboardLayout>
  )
}
