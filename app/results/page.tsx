"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Filter, Download, MoreHorizontal, Eye, FileText, Upload } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { UploadResultForm } from "@/components/forms"

const results = [
  { id: 1, student: "John Smith", studentId: "STU001", avatar: "/placeholder.svg?height=32&width=32", class: "Grade 10A", exam: "Math Midterm", marks: 92, maxMarks: 100, grade: "A+", percentage: 92, status: "published" },
  { id: 2, student: "Sarah Johnson", studentId: "STU002", avatar: "/placeholder.svg?height=32&width=32", class: "Grade 10B", exam: "English Finals", marks: 78, maxMarks: 80, grade: "A", percentage: 97.5, status: "published" },
  { id: 3, student: "Michael Brown", studentId: "STU003", avatar: "/placeholder.svg?height=32&width=32", class: "Grade 9A", exam: "Science Test", marks: 65, maxMarks: 100, grade: "B", percentage: 65, status: "published" },
  { id: 4, student: "Emily Davis", studentId: "STU004", avatar: "/placeholder.svg?height=32&width=32", class: "Grade 11A", exam: "History Exam", marks: 55, maxMarks: 100, grade: "C", percentage: 55, status: "published" },
  { id: 5, student: "David Wilson", studentId: "STU005", avatar: "/placeholder.svg?height=32&width=32", class: "Grade 10A", exam: "Math Midterm", marks: 88, maxMarks: 100, grade: "A", percentage: 88, status: "published" },
  { id: 6, student: "Lisa Anderson", studentId: "STU006", avatar: "/placeholder.svg?height=32&width=32", class: "Grade 9B", exam: "Science Test", marks: 72, maxMarks: 100, grade: "B+", percentage: 72, status: "draft" },
]

const getGradeBadge = (grade: string) => {
  const gradeColors: Record<string, string> = {
    "A+": "bg-green-100 text-green-700 hover:bg-green-100",
    A: "bg-green-100 text-green-700 hover:bg-green-100",
    "B+": "bg-blue-100 text-blue-700 hover:bg-blue-100",
    B: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    C: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
    D: "bg-orange-100 text-orange-700 hover:bg-orange-100",
    F: "bg-red-100 text-red-700 hover:bg-red-100",
  }
  return <Badge className={gradeColors[grade] || ""}>{grade}</Badge>
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "published": return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Published</Badge>
    case "draft": return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Draft</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
}

export default function ResultsPage() {
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Results</h1>
            <p className="text-sm text-muted-foreground">View and publish exam results</p>
          </div>
          <Button className="gap-2" onClick={() => setShowUploadForm(true)}>
            <Upload className="h-4 w-4" />
            Upload Results
          </Button>
        </div>

        <UploadResultForm open={showUploadForm} onOpenChange={setShowUploadForm} onSuccess={() => setRefreshKey(prev => prev + 1)} />

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search results..." className="pl-10" />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              <SelectItem value="10a">Grade 10A</SelectItem>
              <SelectItem value="10b">Grade 10B</SelectItem>
              <SelectItem value="9a">Grade 9A</SelectItem>
              <SelectItem value="11a">Grade 11A</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all-exams">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select exam" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-exams">All Exams</SelectItem>
              <SelectItem value="midterm">Midterm</SelectItem>
              <SelectItem value="finals">Finals</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        <Card key={refreshKey}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Exam</TableHead>
                <TableHead>Marks</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result) => (
                <TableRow key={result.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={result.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {result.student.split(" ").map((n) => n[0]).join("")}
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
                    <span className="font-medium">{result.marks}/{result.maxMarks}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{result.percentage.toFixed(1)}%</span>
                  </TableCell>
                  <TableCell>{getGradeBadge(result.grade)}</TableCell>
                  <TableCell>{getStatusBadge(result.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                        <DropdownMenuItem><FileText className="mr-2 h-4 w-4" />Download Report Card</DropdownMenuItem>
                        {result.status === "draft" && (
                          <DropdownMenuItem><Upload className="mr-2 h-4 w-4" />Publish Result</DropdownMenuItem>
                        )}
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
