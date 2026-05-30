"use client"

import { useState } from "react"
import { bulkUpsertResultAction } from "@/app/(dashboard)/dashboard/results/actions"
import { toggleMarksLockAction, togglePublishResultsAction } from "@/app/(dashboard)/dashboard/exams/actions"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Lock, Unlock, CheckCircle, Save, AlertCircle } from "lucide-react"

export default function GradebookGrid({ exam, students, initialResults, activeSessionId }: any) {
  const [loading, setLoading] = useState(false)
  const [overrideReason, setOverrideReason] = useState("")

  // Map initial results by studentId
  const initialResultMap = new Map()
  initialResults.forEach((r: any) => initialResultMap.set(r.studentId, r))

  type ResultStateItem = {
    studentId: string
    name: string
    rollNumber: string
    marks: string | number
    grade: string
    status: string
    remarks: string
  }

  // Local state for all student inputs
  const [resultsState, setResultsState] = useState<ResultStateItem[]>(
    students.map((s: any) => {
      const existing = initialResultMap.get(s.id)
      return {
        studentId: s.id,
        name: s.name,
        rollNumber: s.rollNumber,
        marks: existing?.marks ?? "",
        grade: existing?.grade ?? "",
        status: existing?.status ?? "PUBLISHED",
        remarks: existing?.remarks ?? "",
      }
    })
  )

  const handleInputChange = (studentId: string, field: string, value: string) => {
    setResultsState(prev => prev.map(r => 
      r.studentId === studentId ? { ...r, [field]: value } : r
    ))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("examId", exam.id)
      formData.append("sessionId", activeSessionId)
      
      const payload = resultsState.map(r => ({
        studentId: r.studentId,
        marks: r.marks === "" ? null : parseFloat(r.marks as string),
        grade: r.grade === "" ? null : r.grade,
        status: r.status,
        remarks: r.remarks,
      }))
      
      formData.append("results", JSON.stringify(payload))
      if (overrideReason) formData.append("overrideReason", overrideReason)

      const result = await bulkUpsertResultAction(formData)
      if (!result.success) throw new Error(result.error)

      toast.success(`Saved! ${result.upsertedCount} records updated.`)
      setOverrideReason("")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLockToggle = async () => {
    try {
      const result = await toggleMarksLockAction(exam.id, !exam.marksLocked)
      if (!result.success) throw new Error(result.error)
      toast.success(exam.marksLocked ? "Exam unlocked" : "Exam locked")
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handlePublishToggle = async () => {
    try {
      const result = await togglePublishResultsAction(exam.id, !exam.resultsPublished)
      if (!result.success) throw new Error(result.error)
      toast.success(exam.resultsPublished ? "Results unpublished" : "Results published")
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
        <div className="flex items-center gap-4">
          <Button 
            variant={exam.marksLocked ? "destructive" : "outline"} 
            className="gap-2"
            onClick={handleLockToggle}
          >
            {exam.marksLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            {exam.marksLocked ? "Locked" : "Lock Marks"}
          </Button>

          <Button 
            variant={exam.resultsPublished ? "default" : "outline"} 
            className="gap-2"
            onClick={handlePublishToggle}
          >
            <CheckCircle className="w-4 h-4" />
            {exam.resultsPublished ? "Published" : "Publish Results"}
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          {exam.marksLocked && (
            <Input 
              placeholder="Admin Override Reason..." 
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              className="w-64 border-amber-500 focus-visible:ring-amber-500"
            />
          )}
          <Button onClick={handleSave} disabled={loading} className="gap-2">
            <Save className="w-4 h-4" />
            {loading ? "Saving..." : "Save Gradebook"}
          </Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Roll No.</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Marks (/{exam.maxMarks})</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resultsState.map((student) => (
              <TableRow key={student.studentId}>
                <TableCell>{student.rollNumber || "N/A"}</TableCell>
                <TableCell className="font-medium">{student.name}</TableCell>
                <TableCell>
                  <Select 
                    value={student.status} 
                    onValueChange={(val) => handleInputChange(student.studentId, "status", val)}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLISHED">Present</SelectItem>
                      <SelectItem value="ABSENT">Absent</SelectItem>
                      <SelectItem value="EXEMPTED">Exempted</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input 
                    type="number" 
                    value={student.marks}
                    onChange={(e) => handleInputChange(student.studentId, "marks", e.target.value)}
                    className="w-24"
                    disabled={student.status !== "PUBLISHED"}
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    value={student.grade}
                    onChange={(e) => handleInputChange(student.studentId, "grade", e.target.value)}
                    className="w-20 uppercase"
                    disabled={student.status !== "PUBLISHED"}
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    value={student.remarks}
                    onChange={(e) => handleInputChange(student.studentId, "remarks", e.target.value)}
                    placeholder="Optional..."
                  />
                </TableCell>
              </TableRow>
            ))}
            {resultsState.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                  No students found in this batch.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
