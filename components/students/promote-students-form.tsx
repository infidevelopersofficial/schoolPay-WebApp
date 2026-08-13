"use client"

import { useState, useTransition, useEffect } from "react"
import { useActionState } from "react"
import { searchStudentsForPromotionAction, promoteStudentsAction } from "@/app/(dashboard)/dashboard/students/promote/actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type StudentState = "PROMOTE" | "DETAINED" | "EXCLUDED"

interface PromoteStudentsFormProps {
  classes: string[]
  classSections: Record<string, string[]>
  sessions: any[]
  defaultTargetSessionId?: string
}

export function PromoteStudentsForm({ classes, classSections, sessions, defaultTargetSessionId }: PromoteStudentsFormProps) {
  // Source Selection State
  const [sourceClass, setSourceClass] = useState<string>("")
  const [sourceSection, setSourceSection] = useState<string>("")
  const [sourceSessionId, setSourceSessionId] = useState<string>("")

  // Target Selection State
  const [targetClass, setTargetClass] = useState<string>("")
  const [targetSection, setTargetSection] = useState<string>("")
  const [targetSessionId, setTargetSessionId] = useState<string>(defaultTargetSessionId || "")

  // Preview State
  const [isPending, startTransition] = useTransition()
  const [students, setStudents] = useState<any[]>([])
  const [studentStates, setStudentStates] = useState<Record<string, StudentState>>({})
  const [hasSearched, setHasSearched] = useState(false)

  // Action State
  const [state, formAction, isSubmitting] = useActionState(promoteStudentsAction, null)

  // Fetch Students when source changes
  useEffect(() => {
    if (sourceClass && sourceSessionId) {
      startTransition(async () => {
        try {
          const results = await searchStudentsForPromotionAction(sourceClass, sourceSection || undefined, sourceSessionId)
          // Default all to PROMOTE
          const states: Record<string, StudentState> = {}
          results.forEach((s: any) => {
            states[s.id] = "PROMOTE"
          })
          setStudents(results)
          setStudentStates(states)
          setHasSearched(true)
        } catch (error) {
          console.error("Failed to load students:", error)
        }
      })
    } else {
      setStudents([])
      setStudentStates({})
      setHasSearched(false)
    }
  }, [sourceClass, sourceSection, sourceSessionId])

  const handleStateChange = (studentId: string, newState: StudentState) => {
    setStudentStates(prev => ({
      ...prev,
      [studentId]: newState
    }))
  }

  const promoteCount = Object.values(studentStates).filter(s => s === "PROMOTE").length
  const detainCount = Object.values(studentStates).filter(s => s === "DETAINED").length
  const excludeCount = Object.values(studentStates).filter(s => s === "EXCLUDED").length

  const canSubmit = 
    sourceClass && sourceSessionId && 
    targetClass && targetSessionId && 
    (promoteCount > 0 || detainCount > 0)

  // We are storing these so we can pass them in hidden inputs
  const promotedIds = Object.entries(studentStates).filter(([_, s]) => s === "PROMOTE").map(([id]) => id)
  const detainedIds = Object.entries(studentStates).filter(([_, s]) => s === "DETAINED").map(([id]) => id)

  if ((state as any)?.success) {
    return (
      <Card className="border-green-200 dark:border-green-900">
        <CardHeader className="bg-green-50/50 dark:bg-green-900/20">
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-6 w-6" />
            Promotion Successful
          </CardTitle>
          <CardDescription>
            The promotion batch has been processed and recorded in the audit trail.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-muted rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{(state as any).promoted}</div>
              <div className="text-sm text-muted-foreground">Students Promoted</div>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600">{(state as any).detained}</div>
              <div className="text-sm text-muted-foreground">Students Detained</div>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-600">{(state as any).skipped?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Students Skipped</div>
            </div>
          </div>

          {(state as any).skipped && (state as any).skipped.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-2">Skipped Details</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                {(state as any).skipped.map((skip: any, i: number) => (
                  <li key={i}>ID {skip.studentId}: {skip.reason}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="pt-4">
            <Button onClick={() => window.location.reload()}>Run Another Promotion</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <form action={formAction} className="space-y-6">
      {(state as any)?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{(state as any)?.error}</AlertDescription>
        </Alert>
      )}

      {/* Hidden Fields for the Server Action */}
      <input type="hidden" name="sourceClass" value={sourceClass} />
      <input type="hidden" name="sourceSection" value={sourceSection} />
      <input type="hidden" name="sourceSessionId" value={sourceSessionId} />
      <input type="hidden" name="targetClass" value={targetClass} />
      <input type="hidden" name="targetSection" value={targetSection} />
      <input type="hidden" name="targetSessionId" value={targetSessionId} />
      <input type="hidden" name="studentIds" value={JSON.stringify(promotedIds)} />
      <input type="hidden" name="detainedStudentIds" value={JSON.stringify(detainedIds)} />

      {/* SECTION 1 & 3: Source and Target Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Source Criteria</CardTitle>
            <CardDescription>Select the current batch of students.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Source Academic Session</Label>
              <Select value={sourceSessionId} onValueChange={setSourceSessionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} {s.isCurrent && "(Current)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Source Class</Label>
              <Select value={sourceClass} onValueChange={(val) => { setSourceClass(val); setSourceSection(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Source Section (Optional)</Label>
              <Select value={sourceSection} onValueChange={setSourceSection} disabled={!sourceClass || !classSections[sourceClass]?.length}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Sections</SelectItem>
                  {sourceClass && classSections[sourceClass]?.map(sec => (
                    <SelectItem key={sec} value={sec}>{sec}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Target Criteria</CardTitle>
            <CardDescription>Where should these students be promoted to?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Target Academic Session</Label>
              <Select value={targetSessionId} onValueChange={setTargetSessionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Target Session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} {s.isCurrent && "(Current)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target Class</Label>
              <Select value={targetClass} onValueChange={(val) => { setTargetClass(val); setTargetSection(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Target Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target Section (Optional)</Label>
              <Select value={targetSection} onValueChange={setTargetSection} disabled={!targetClass || !classSections[targetClass]?.length}>
                <SelectTrigger>
                  <SelectValue placeholder="Keep Same Section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Keep Same Section</SelectItem>
                  {targetClass && classSections[targetClass]?.map(sec => (
                    <SelectItem key={sec} value={sec}>{sec}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 2: Student Preview Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg">Student Preview</CardTitle>
            <CardDescription>
              {isPending ? (
                <span className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Loading students...</span>
              ) : hasSearched ? (
                <span>Found {students.length} students</span>
              ) : (
                "Select source criteria to load students"
              )}
            </CardDescription>
          </div>
          {hasSearched && (
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {promoteCount} Promote
              </Badge>
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                {detainCount} Detain
              </Badge>
              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                {excludeCount} Exclude
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0 z-10">
                  <tr className="text-left font-medium">
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Current Class</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {!hasSearched ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-muted-foreground">
                        Select a source class and session to view students.
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-muted-foreground">
                        No active students found in this class/session.
                      </td>
                    </tr>
                  ) : (
                    students.map(student => {
                      const state = studentStates[student.id]
                      return (
                        <tr key={student.id} className={`border-t ${state === 'EXCLUDED' ? 'opacity-50 bg-muted/30' : ''}`}>
                          <td className="p-3 font-medium">
                            {student.name}
                            {student.admissionNumber && <span className="text-muted-foreground ml-2 text-xs">({student.admissionNumber})</span>}
                          </td>
                          <td className="p-3">
                            {student.class} {student.section ? `- ${student.section}` : ''}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center space-x-1 border rounded-md w-fit bg-muted p-1">
                              <button
                                type="button"
                                onClick={() => handleStateChange(student.id, "PROMOTE")}
                                className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                                  state === "PROMOTE" ? "bg-green-100 text-green-800 shadow-sm" : "text-muted-foreground hover:bg-muted-foreground/10"
                                }`}
                              >
                                Promote
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStateChange(student.id, "DETAINED")}
                                className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                                  state === "DETAINED" ? "bg-orange-100 text-orange-800 shadow-sm" : "text-muted-foreground hover:bg-muted-foreground/10"
                                }`}
                              >
                                Detain
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStateChange(student.id, "EXCLUDED")}
                                className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                                  state === "EXCLUDED" ? "bg-gray-200 text-gray-800 shadow-sm" : "text-muted-foreground hover:bg-muted-foreground/10"
                                }`}
                              >
                                Exclude
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 flex justify-end p-4 border-t">
          <Button type="submit" disabled={!canSubmit || isSubmitting || isPending}>
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
            ) : (
              "Confirm & Promote Students"
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
