import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const penalties = [
  {
    id: "PEN001",
    name: "Late Payment Fine",
    type: "Percentage",
    value: "2%",
    applicableAfter: "Due Date",
    frequency: "Per Week",
    maxPenalty: "10%",
    status: "active",
  },
  {
    id: "PEN002",
    name: "Returned Check Fee",
    type: "Fixed Amount",
    value: "$35",
    applicableAfter: "Bounce",
    frequency: "Per Instance",
    maxPenalty: "N/A",
    status: "active",
  },
  {
    id: "PEN003",
    name: "Overdue Interest",
    type: "Percentage",
    value: "1.5%",
    applicableAfter: "30 Days",
    frequency: "Per Month",
    maxPenalty: "15%",
    status: "active",
  },
  {
    id: "PEN004",
    name: "Collection Fee",
    type: "Fixed Amount",
    value: "$50",
    applicableAfter: "90 Days",
    frequency: "One Time",
    maxPenalty: "N/A",
    status: "active",
  },
  {
    id: "PEN005",
    name: "Re-enrollment Fee",
    type: "Fixed Amount",
    value: "$100",
    applicableAfter: "Dropped",
    frequency: "One Time",
    maxPenalty: "N/A",
    status: "inactive",
  },
]

export function PenaltiesTable() {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Penalty Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Applicable After</TableHead>
            <TableHead>Frequency</TableHead>
            <TableHead>Max Penalty</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {penalties.map((penalty) => (
            <TableRow key={penalty.id}>
              <TableCell className="font-medium">{penalty.name}</TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  {penalty.type}
                </Badge>
              </TableCell>
              <TableCell className="font-semibold text-red-600">{penalty.value}</TableCell>
              <TableCell>{penalty.applicableAfter}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{penalty.frequency}</TableCell>
              <TableCell>{penalty.maxPenalty}</TableCell>
              <TableCell>
                <Badge
                  className={
                    penalty.status === "active"
                      ? "bg-green-100 text-green-700 hover:bg-green-100"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                  }
                >
                  {penalty.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
