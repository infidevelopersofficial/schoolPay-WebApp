import { getMyResults } from "@/lib/dal/student-portal"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const metadata = {
  title: "My Results | SchoolPay",
}

export default async function StudentResultsPage() {
  const results = await getMyResults()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Examination Results</h1>
        <p className="text-muted-foreground">View your published exam marks and grades.</p>
      </div>

      {results.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
            <p>No results have been published yet.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam Group</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Marks Obtained</TableHead>
                  <TableHead>Total Marks</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Date Published</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">
                      {result.exam?.examGroup?.name || "Exam"}
                    </TableCell>
                    <TableCell>{result.exam?.subject?.name || result.exam?.name || "-"}</TableCell>
                    <TableCell className="font-bold">{result.marks ?? "-"}</TableCell>
                    <TableCell>{result.exam?.maxMarks ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{result.grade || "-"}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(result.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {results.map((result) => (
              <Card key={result.id}>
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{result.exam?.examGroup?.name || "Exam"}</h3>
                      <p className="text-xs text-muted-foreground">{result.exam?.subject?.name || result.exam?.name || "-"}</p>
                    </div>
                    <Badge variant="outline">{result.grade || "-"}</Badge>
                  </div>
                  <div className="flex justify-between items-end border-t pt-3">
                    <p className="text-xs text-muted-foreground">
                      Published {new Date(result.createdAt).toLocaleDateString()}
                    </p>
                    <div className="text-right">
                      <span className="text-2xl font-bold">{result.marks ?? "-"}</span>
                      <span className="text-sm text-muted-foreground"> / {result.exam?.maxMarks ?? "-"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
