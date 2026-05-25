"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter, Lock, Unlock, CheckCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExamGroupForm } from "./ExamGroupForm"
import { ExamForm } from "./ExamForm"
import Link from "next/link"

export default function ExamDashboard({
  initialExamGroups,
  initialExams,
  batches,
  subjects,
  gradingSchemes,
  activeSessionId,
}: any) {
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [showExamForm, setShowExamForm] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button className="gap-2" onClick={() => setShowGroupForm(true)}>
          <Plus className="h-4 w-4" />
          Create Exam Group
        </Button>
        <Button className="gap-2" variant="outline" onClick={() => setShowExamForm(true)}>
          <Plus className="h-4 w-4" />
          Schedule Exam
        </Button>
      </div>

      <ExamGroupForm 
        open={showGroupForm} 
        onOpenChange={setShowGroupForm} 
        gradingSchemes={gradingSchemes}
        activeSessionId={activeSessionId}
      />
      <ExamForm 
        open={showExamForm} 
        onOpenChange={setShowExamForm}
        examGroups={initialExamGroups}
        batches={batches}
        subjects={subjects}
        activeSessionId={activeSessionId}
      />

      <Tabs defaultValue="groups" className="space-y-4">
        <TabsList>
          <TabsTrigger value="groups">Exam Groups</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Grading Scheme</TableHead>
                  <TableHead>Exams Configured</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialExamGroups.map((group: any) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell>{group.gradingScheme?.name || "None"}</TableCell>
                    <TableCell>{group._count?.exams || 0}</TableCell>
                    <TableCell>{new Date(group.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {initialExamGroups.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      No Exam Groups found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="exams" className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam Name</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Lock Status</TableHead>
                  <TableHead>Publish Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialExams.map((exam: any) => (
                  <TableRow key={exam.id}>
                    <TableCell className="font-medium">{exam.name}</TableCell>
                    <TableCell>{exam.examGroup.name}</TableCell>
                    <TableCell>{exam.batch.name}</TableCell>
                    <TableCell>{exam.subject.name}</TableCell>
                    <TableCell>{exam.date}</TableCell>
                    <TableCell>
                      {exam.marksLocked ? (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100"><Lock className="w-3 h-3 mr-1" /> Locked</Badge>
                      ) : (
                        <Badge variant="outline"><Unlock className="w-3 h-3 mr-1" /> Open</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {exam.resultsPublished ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" /> Published</Badge>
                      ) : (
                        <Badge variant="outline">Draft</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/exams/${exam.id}`}>
                        <Button variant="outline" size="sm">Gradebook</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {initialExams.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                      No Exams found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
