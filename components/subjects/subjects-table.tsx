"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { deleteSubjectAction } from "@/app/(dashboard)/dashboard/subjects/actions"
import { MoreHorizontal, Pencil, Eye } from "lucide-react"
import { DeleteConfirm } from "@/components/ui/delete-confirm"
import { DataTableExport } from "@/components/ui/data-table-export"

interface Subject {
  id: string
  name: string
  code: string
  teacherSubjects?: { teacher: { name: string } }[]
  description?: string | null
  createdAt: Date
}

export function SubjectsTable({ data }: { data: Subject[] }) {
  const { toast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        const result = await deleteSubjectAction(id)
        if (result?.error) {
          toast({ title: "Error", description: result.error, variant: "destructive" })
        } else {
          toast({ title: "Success", description: "Subject deleted successfully." })
        }
      } catch (err: any) {
        toast({ title: "Error", description: err.message || "Failed to delete", variant: "destructive" })
      }
    })
  }

  if (data.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
          <h3 className="mt-4 text-lg font-semibold">No subjects added</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground">
            You have not added any subjects yet. Add one to get started.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-md border bg-white dark:bg-slate-950">
      <div className="p-4 flex justify-end items-center border-b">
        <DataTableExport 
          filename="Subjects_Export" 
          data={data} 
          columns={[
          { header: "Code", key: "code" },
          { header: "Name", key: "name" },
          { header: "Teacher", key: (r) => r.teacherSubjects?.map((ts: any) => ts.teacher.name).join(", ") || "" },
          { header: "Description", key: "description" }
        ]} 
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Subject Name</TableHead>
            <TableHead>Teacher</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((subject) => (
            <TableRow key={subject.id}>
              <TableCell>
                <Badge variant="outline" className="font-mono">{subject.code}</Badge>
              </TableCell>
              <TableCell className="font-medium">{subject.name}</TableCell>
              <TableCell>
                {subject.teacherSubjects && subject.teacherSubjects.length > 0
                  ? subject.teacherSubjects.map(ts => ts.teacher.name).join(", ")
                  : "-"}
              </TableCell>
              <TableCell className="text-muted-foreground max-w-xs truncate">{subject.description || "-"}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isPending}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push(`/dashboard/subjects/${subject.id}`)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/dashboard/subjects/${subject.id}/edit`)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DeleteConfirm
                      name={subject.name}
                      onConfirm={() => handleDelete(subject.id)}
                    />
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
