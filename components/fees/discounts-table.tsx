import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const discounts = [
  {
    id: "DIS001",
    name: "Sibling Discount",
    type: "Percentage",
    value: "10%",
    applicableTo: "Tuition Fee",
    criteria: "2+ siblings enrolled",
    status: "active",
  },
  {
    id: "DIS002",
    name: "Early Bird Discount",
    type: "Percentage",
    value: "5%",
    applicableTo: "All Fees",
    criteria: "Payment before due date",
    status: "active",
  },
  {
    id: "DIS003",
    name: "Merit Scholarship",
    type: "Fixed Amount",
    value: "$500",
    applicableTo: "Tuition Fee",
    criteria: "GPA above 3.8",
    status: "active",
  },
  {
    id: "DIS004",
    name: "Staff Ward Discount",
    type: "Percentage",
    value: "25%",
    applicableTo: "All Fees",
    criteria: "Staff children",
    status: "active",
  },
  {
    id: "DIS005",
    name: "Financial Aid",
    type: "Percentage",
    value: "50%",
    applicableTo: "Tuition Fee",
    criteria: "Income below threshold",
    status: "active",
  },
  {
    id: "DIS006",
    name: "Returning Student",
    type: "Fixed Amount",
    value: "$100",
    applicableTo: "Registration Fee",
    criteria: "Re-enrollment",
    status: "inactive",
  },
]

export function DiscountsTable() {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Discount Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Applicable To</TableHead>
            <TableHead>Criteria</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {discounts.map((discount) => (
            <TableRow key={discount.id}>
              <TableCell className="font-medium">{discount.name}</TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {discount.type}
                </Badge>
              </TableCell>
              <TableCell className="font-semibold text-green-600">{discount.value}</TableCell>
              <TableCell>{discount.applicableTo}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{discount.criteria}</TableCell>
              <TableCell>
                <Badge
                  className={
                    discount.status === "active"
                      ? "bg-green-100 text-green-700 hover:bg-green-100"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-100"
                  }
                >
                  {discount.status}
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
