"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, BookOpen, Users, Download, ArrowRight } from "lucide-react"
import { MarkEntry } from "./mark-entry"
import { format } from "date-fns"

export function ResultsDashboardClient({ examGroups }: { examGroups: any[] }) {
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null)

  if (selectedGroup) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedGroup(null)} className="mb-4">
          ← Back to Exam Groups
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{selectedGroup.name}</h2>
            <p className="text-muted-foreground">{selectedGroup.session.name} • {selectedGroup.exams.length} Exams</p>
          </div>
        </div>
        <MarkEntry examGroup={selectedGroup} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {examGroups.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <CardTitle>No Exam Groups Found</CardTitle>
          <CardDescription className="max-w-md mt-2">
            Create an Exam Group from the Exams module before entering marks or generating report cards.
          </CardDescription>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {examGroups.map((group) => (
            <Card key={group.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className="bg-primary/5 text-primary">
                    {group.session.name}
                  </Badge>
                  {group.gradingScheme && (
                    <Badge variant="secondary" className="text-xs">
                      {group.gradingScheme.name}
                    </Badge>
                  )}
                </div>
                <CardTitle className="mt-2">{group.name}</CardTitle>
                <CardDescription>
                  <span className="flex items-center gap-1 mt-1 text-xs">
                    <Calendar className="h-3 w-3" /> Created {format(new Date(group.createdAt), 'MMM d, yyyy')}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> Exams
                  </span>
                  <span className="font-medium">{group.exams.length}</span>
                </div>
                
                <Button className="w-full justify-between" onClick={() => setSelectedGroup(group)}>
                  Manage Results <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
