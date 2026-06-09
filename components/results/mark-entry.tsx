"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { getStudentsForExamAction, saveStudentResultAction, computeGradesAction, getReportCardsDataAction } from "@/app/(dashboard)/dashboard/results/actions"
import { Loader2, Download, Search, CheckCircle2, AlertCircle } from "lucide-react"
import { generateBulkReportCardsZIP } from "./report-card-pdf"

export function MarkEntry({ examGroup }: { examGroup: any }) {
  const [selectedExamId, setSelectedExamId] = useState<string>("")
  const [students, setStudents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [savingState, setSavingState] = useState<Record<string, 'saving' | 'saved' | 'error'>>({})
  const [isComputing, setIsComputing] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const selectedExam = examGroup.exams.find((e: any) => e.id === selectedExamId)

  useEffect(() => {
    if (selectedExamId) {
      loadStudents()
    } else {
      setStudents([])
    }
  }, [selectedExamId])

  const loadStudents = async () => {
    setIsLoading(true)
    const result = await getStudentsForExamAction(selectedExamId)
    if ("success" in result && result.success && result.data) {
      setStudents(result.data)
    } else {
      toast.error(result.error || "Failed to load students")
    }
    setIsLoading(false)
  }

  const handleMarkChange = async (studentId: string, val: string) => {
    const marks = val === "" ? null : parseFloat(val)
    if (marks !== null && isNaN(marks)) return
    
    if (marks !== null && selectedExam && marks > selectedExam.maxMarks) {
      toast.error(`Marks cannot exceed max marks (${selectedExam.maxMarks})`)
      return
    }

    setStudents(prev => prev.map(s => {
      if (s.student.id === studentId) {
        return {
          ...s,
          result: { ...s.result, marks: marks }
        }
      }
      return s
    }))

    setSavingState(prev => ({ ...prev, [studentId]: 'saving' }))

    const res = await saveStudentResultAction({
      examId: selectedExamId,
      studentId,
      marks,
      sessionId: examGroup.sessionId
    })

    if ("success" in res && res.success) {
      setSavingState(prev => ({ ...prev, [studentId]: 'saved' }))
      if (res.data) {
         setStudents(prev => prev.map(s => {
          if (s.student.id === studentId) {
            return {
              ...s,
              result: res.data
            }
          }
          return s
        }))
      }
      setTimeout(() => {
        setSavingState(prev => {
          const next = { ...prev }
          delete next[studentId]
          return next
        })
      }, 2000)
    } else {
      setSavingState(prev => ({ ...prev, [studentId]: 'error' }))
      toast.error(res.error || "Failed to save marks")
    }
  }

  const handleComputeGrades = async () => {
    if (!examGroup.gradingSchemeId) {
      toast.error("No grading scheme assigned to this Exam Group")
      return
    }
    
    setIsComputing(true)
    const res = await computeGradesAction(examGroup.id)
    setIsComputing(false)
    
    if ("success" in res && res.success) {
      toast.success("Grades computed successfully")
      loadStudents()
    } else {
      toast.error(res.error || "Failed to compute grades")
    }
  }

  const handleDownloadPDFs = async () => {
    if (!selectedExam) return
    setIsDownloading(true)
    try {
      const res = await getReportCardsDataAction(examGroup.id, selectedExam.batchId)
      if ("success" in res && res.success && res.data) {
        await generateBulkReportCardsZIP(res.data, `${examGroup.name}_${selectedExam.batch.name}_ReportCards.zip`)
        toast.success("Report cards generated successfully")
      } else {
        toast.error(res.error || "Failed to generate report cards")
      }
    } catch (e) {
      toast.error("An error occurred during PDF generation")
    } finally {
      setIsDownloading(false)
    }
  }

  const filteredStudents = students.filter(s => 
    s.student.name.toLowerCase().includes(search.toLowerCase()) || 
    s.student.admissionNumber?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end justify-between">
            <div className="space-y-1 w-full max-w-sm">
              <label className="text-sm font-medium">Select Exam & Subject</label>
              <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Exam..." />
                </SelectTrigger>
                <SelectContent>
                  {examGroup.exams.map((exam: any) => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.subject.name} - {exam.batch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedExam && (
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleComputeGrades} disabled={isComputing || !examGroup.gradingSchemeId}>
                  {isComputing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Compute Grades
                </Button>
                <Button variant="outline" disabled={students.length === 0 || isDownloading} onClick={handleDownloadPDFs}>
                  {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  Download PDFs
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        {selectedExam && (
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4 text-sm">
                <div>Max Marks: <span className="font-semibold">{selectedExam.maxMarks}</span></div>
                <div>Status: <Badge variant={selectedExam.resultsPublished ? "default" : "secondary"}>{selectedExam.resultsPublished ? "PUBLISHED" : "DRAFT"}</Badge></div>
              </div>
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
              </div>
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="w-32">Marks</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No students found in this batch.
                      </TableCell>
                    </TableRow>
                  ) : filteredStudents.map((s) => {
                    const saveStatus = savingState[s.student.id]
                    return (
                      <TableRow key={s.student.id}>
                        <TableCell className="text-muted-foreground">{s.student.rollNumber || '-'}</TableCell>
                        <TableCell className="font-medium">{s.student.name}</TableCell>
                        <TableCell>
                          <div className="relative">
                            <Input 
                              type="number" 
                              max={selectedExam.maxMarks}
                              min={0}
                              disabled={selectedExam.resultsPublished}
                              className="pr-8"
                              defaultValue={s.result?.marks ?? ""}
                              onBlur={(e) => {
                                if (e.target.value !== (s.result?.marks?.toString() ?? "")) {
                                  handleMarkChange(s.student.id, e.target.value)
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') e.currentTarget.blur()
                              }}
                            />
                            {saveStatus === 'saving' && <Loader2 className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />}
                            {saveStatus === 'saved' && <CheckCircle2 className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-green-500" />}
                            {saveStatus === 'error' && <AlertCircle className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-red-500" />}
                          </div>
                        </TableCell>
                        <TableCell>
                          {s.result?.grade ? (
                            <Badge variant="outline">{s.result.grade}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {s.result?.status ? (
                            <Badge variant="secondary" className="text-xs">{s.result.status}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">PENDING</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
