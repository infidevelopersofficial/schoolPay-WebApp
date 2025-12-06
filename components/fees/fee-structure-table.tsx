"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const feeStructure = [
  {
    id: "FEE001",
    name: "Tuition Fee",
    description: "Monthly tuition charges",
    amount: 500,
    frequency: "Monthly",
    applicableTo: "All Students",
    status: "active",
  },
  {
    id: "FEE002",
    name: "Library Fee",
    description: "Annual library access and books",
    amount: 150,
    frequency: "Annually",
    applicableTo: "All Students",
    status: "active",
  },
  {
    id: "FEE003",
    name: "Sports Fee",
    description: "Sports activities and equipment",
    amount: 200,
    frequency: "Annually",
    applicableTo: "All Students",
    status: "active",
  },
  {
    id: "FEE004",
    name: "Lab Fee",
    description: "Science and computer lab usage",
    amount: 100,
    frequency: "Per Semester",
    applicableTo: "Grade 9-12",
    status: "active",
  },
  {
    id: "FEE005",
    name: "Transportation Fee",
    description: "School bus service",
    amount: 250,
    frequency: "Monthly",
    applicableTo: "Opted Students",
    status: "active",
  },
  {
    id: "FEE006",
    name: "Exam Fee",
    description: "Examination and grading charges",
    amount: 75,
    frequency: "Per Semester",
    applicableTo: "All Students",
    status: "inactive",
  },
]

export function FeeStructureTable() {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fee Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Frequency</TableHead>
            <TableHead>Applicable To</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {feeStructure.map((fee) => (
            <TableRow key={fee.id}>
              <TableCell className="font-medium">{fee.name}</TableCell>
              <TableCell className="text-muted-foreground">{fee.description}</TableCell>
              <TableCell className="font-semibold">${fee.amount}</TableCell>
              <TableCell>{fee.frequency}</TableCell>
              <TableCell>{fee.applicableTo}</TableCell>
              <TableCell>
                <Badge
                  className={fee.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}
                >
                  {fee.status}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
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
