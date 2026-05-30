"use client"

import { useState, useRef, useEffect, KeyboardEvent } from "react"
import { AttendanceStatus } from "@prisma/client"
import { saveAttendanceAction, lockAttendanceAction } from "@/app/(dashboard)/dashboard/attendance/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"

interface StudentInfo {
  id: string
  name: string
  rollNumber: string | null
}

interface AttendanceGridProps {
  batchId: string
  date: string
  students: StudentInfo[]
  existingRecords: Record<string, { status: AttendanceStatus, remarks?: string }>
  isLocked: boolean
  isAdmin: boolean
}

export function AttendanceGrid({ batchId, date, students, existingRecords, isLocked, isAdmin }: AttendanceGridProps) {
  const [records, setRecords] = useState<Record<string, { status: AttendanceStatus, remarks: string }>>(() => {
    const init: Record<string, { status: AttendanceStatus, remarks: string }> = {}
    for (const student of students) {
      init[student.id] = {
        status: existingRecords[student.id]?.status || "PRESENT", // Default to present when initializing grid
        remarks: existingRecords[student.id]?.remarks || ""
      }
    }
    return init
  })

  const [saving, setSaving] = useState(false)
  const [locking, setLocking] = useState(false)
  const [lockReason, setLockReason] = useState("")

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    if (isLocked && !isAdmin) return
    setRecords(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        batchId,
        date,
        records: Object.entries(records).map(([studentId, data]) => ({
          studentId,
          status: data.status,
          remarks: data.remarks
        }))
      }
      await saveAttendanceAction(payload)
      toast.success("Attendance saved successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to save attendance")
    } finally {
      setSaving(false)
    }
  }

  const handleLock = async () => {
    if (isAdmin && !lockReason) {
      toast.error("Admins must provide a reason to lock/unlock.")
      return
    }
    setLocking(true)
    try {
      await lockAttendanceAction(batchId, date, lockReason)
      toast.success("Attendance register locked")
      window.location.reload() // Refresh to update server state
    } catch (error: any) {
      toast.error(error.message || "Failed to lock attendance")
    } finally {
      setLocking(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Attendance Register</CardTitle>
            <p className="text-sm text-muted-foreground">Date: {date} {isLocked && <Badge variant="destructive" className="ml-2">LOCKED</Badge>}</p>
          </div>
          <div className="flex gap-2">
             {!isLocked || isAdmin ? (
               <Button onClick={handleSave} disabled={saving || students.length === 0}>
                 {saving ? "Saving..." : "Save Draft"}
               </Button>
             ) : null}
             {!isLocked || isAdmin ? (
               <div className="flex gap-2">
                 {isAdmin && isLocked && (
                    <Input 
                      placeholder="Reason for modifying lock..." 
                      value={lockReason} 
                      onChange={(e) => setLockReason(e.target.value)}
                      className="w-48"
                    />
                 )}
                 <Button onClick={handleLock} variant={isLocked ? "destructive" : "default"} disabled={locking || (isAdmin && !lockReason)}>
                   {locking ? "Locking..." : isLocked ? "Update Lock" : "Finalize & Lock"}
                 </Button>
               </div>
             ) : null}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Roll No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                      No students found in this batch.
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.rollNumber || "-"}</TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant={records[student.id].status === "PRESENT" ? "default" : "outline"} 
                            size="sm"
                            disabled={isLocked && !isAdmin}
                            onClick={() => handleStatusChange(student.id, "PRESENT")}
                            className={records[student.id].status === "PRESENT" ? "bg-green-600 hover:bg-green-700" : ""}
                          >
                            P
                          </Button>
                          <Button 
                            variant={records[student.id].status === "ABSENT" ? "default" : "outline"} 
                            size="sm"
                            disabled={isLocked && !isAdmin}
                            onClick={() => handleStatusChange(student.id, "ABSENT")}
                            className={records[student.id].status === "ABSENT" ? "bg-red-600 hover:bg-red-700" : ""}
                          >
                            A
                          </Button>
                          <Button 
                            variant={records[student.id].status === "LATE" ? "default" : "outline"} 
                            size="sm"
                            disabled={isLocked && !isAdmin}
                            onClick={() => handleStatusChange(student.id, "LATE")}
                            className={records[student.id].status === "LATE" ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                          >
                            L
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
