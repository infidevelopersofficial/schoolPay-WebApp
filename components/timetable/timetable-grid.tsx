"use client"

import { useState, useTransition } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Clock, MapPin, User, BookOpen } from "lucide-react"
import { DayOfWeek } from "@prisma/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { upsertTimetablePeriodAction, clearTimetablePeriodAction } from "@/app/(dashboard)/dashboard/timetable/actions"
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog"

interface TimetableGridProps {
  timetable: any // Full timetable with periods, class, session
  subjects: any[]
  teachers: any[]
}

const DAYS: DayOfWeek[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT"]
const MAX_PERIODS = 8

export function TimetableGrid({ timetable, subjects, teachers }: TimetableGridProps) {
  const [isPending, startTransition] = useTransition()
  
  // Modal state
  const [activeCell, setActiveCell] = useState<{ day: DayOfWeek; period: number } | null>(null)
  
  // Form state inside modal
  const [formData, setFormData] = useState({
    startTime: "",
    endTime: "",
    subjectId: "free",
    teacherId: "none",
    roomNumber: ""
  })

  // Open modal and pre-fill data based on existing period or defaults
  const handleOpenModal = (day: DayOfWeek, periodNumber: number) => {
    const existing = timetable.periods.find((p: any) => p.dayOfWeek === day && p.periodNumber === periodNumber)
    
    // Guess defaults based on this period number on OTHER days
    const siblingPeriods = timetable.periods.filter((p: any) => p.periodNumber === periodNumber)
    const defaultStartTime = siblingPeriods[0]?.startTime || ""
    const defaultEndTime = siblingPeriods[0]?.endTime || ""

    setFormData({
      startTime: existing?.startTime || defaultStartTime,
      endTime: existing?.endTime || defaultEndTime,
      subjectId: existing?.subjectId || "free",
      teacherId: existing?.teacherId || "none",
      roomNumber: existing?.roomNumber || ""
    })
    
    setActiveCell({ day, period: periodNumber })
  }

  const handleSave = () => {
    if (!activeCell) return
    if (!formData.startTime || !formData.endTime) {
      toast.error("Start and end time are required")
      return
    }

    startTransition(async () => {
      const payload = {
        timetableId: timetable.id,
        dayOfWeek: activeCell.day,
        periodNumber: activeCell.period,
        startTime: formData.startTime,
        endTime: formData.endTime,
        subjectId: formData.subjectId === "free" ? null : formData.subjectId,
        teacherId: formData.teacherId === "none" ? null : formData.teacherId,
        roomNumber: formData.roomNumber || null
      }

      // We use formData to pass the JSON string to the server action
      const fd = new FormData()
      fd.append("periodData", JSON.stringify(payload))
      
      const result = await upsertTimetablePeriodAction(null, fd)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Period updated successfully")
        setActiveCell(null)
      }
    })
  }



  // Create grid structure
  const periodNumbers = Array.from({ length: MAX_PERIODS }, (_, i) => i + 1)

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="border-b border-r p-4 text-left font-medium w-24">Period</th>
              {DAYS.map(day => (
                <th key={day} className="border-b border-r p-4 text-center font-medium min-w-[180px]">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periodNumbers.map(periodNum => (
              <tr key={periodNum}>
                <td className="border-b border-r p-4 text-center font-medium bg-muted/20">
                  {periodNum}
                </td>
                {DAYS.map(day => {
                  const period = timetable.periods.find((p: any) => p.dayOfWeek === day && p.periodNumber === periodNum)
                  
                  return (
                    <td key={`${day}-${periodNum}`} className="border-b border-r p-2 align-top h-32 relative group">
                      {period ? (
                        <div className="h-full flex flex-col justify-between p-2 rounded-md border bg-card hover:border-primary/50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant="outline" className="text-xs bg-muted">
                              <Clock className="w-3 h-3 mr-1" />
                              {period.startTime} - {period.endTime}
                            </Badge>
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleOpenModal(day, periodNum)}
                                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                                disabled={isPending}
                              >
                                Edit
                              </button>
                              <ConfirmDeleteDialog 
                                title="Clear Period?"
                                description="This will remove the assigned subject and teacher, making this a free period."
                                triggerText={<X className="w-4 h-4" />}
                                triggerVariant="ghost"
                                triggerClassName="p-1 h-auto w-auto hover:bg-destructive/10 rounded text-destructive"
                                onConfirm={async () => {
                                  const result = await clearTimetablePeriodAction(timetable.id, day, periodNum)
                                  if (result?.error) toast.error(result.error)
                                  else toast.success("Period cleared")
                                }}
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-1.5 flex-1">
                            {period.subject ? (
                              <div className="font-semibold text-sm flex items-center">
                                <BookOpen className="w-3.5 h-3.5 mr-1.5 text-primary" />
                                {period.subject.name}
                              </div>
                            ) : (
                              <div className="text-sm italic text-muted-foreground">Free Period</div>
                            )}
                            
                            {period.teacher && (
                              <div className="text-xs text-muted-foreground flex items-center">
                                <User className="w-3 h-3 mr-1" />
                                {period.teacher.name}
                              </div>
                            )}
                            
                            {period.roomNumber && (
                              <div className="text-xs text-muted-foreground flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {period.roomNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="h-full w-full rounded-md border border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-primary/50 transition-colors cursor-pointer"
                          onClick={() => handleOpenModal(day, periodNum)}
                        >
                          <Plus className="w-5 h-5 opacity-50" />
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!activeCell} onOpenChange={(open) => !open && setActiveCell(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {activeCell ? `Assign Period ${activeCell.period} (${activeCell.day})` : "Assign Period"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time (HH:MM)</Label>
                <Input 
                  id="startTime" 
                  type="time" 
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time (HH:MM)</Label>
                <Input 
                  id="endTime" 
                  type="time" 
                  value={formData.endTime}
                  onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Select 
                value={formData.subjectId} 
                onValueChange={(val) => setFormData({...formData, subjectId: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">-- Free Period --</SelectItem>
                  {subjects.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Teacher</Label>
              <Select 
                value={formData.teacherId} 
                onValueChange={(val) => setFormData({...formData, teacherId: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Unassigned --</SelectItem>
                  {teachers.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roomNumber">Room Number (Optional)</Label>
              <Input 
                id="roomNumber" 
                value={formData.roomNumber}
                onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                placeholder="e.g. 101A"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveCell(null)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Saving..." : "Save Period"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
