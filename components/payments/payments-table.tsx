"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye, Receipt, RefreshCcw } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const payments = [
  {
    id: "PAY001",
    student: "John Smith",
    studentId: "STU001",
    amount: 750,
    feeType: "Tuition + Library",
    method: "Credit Card",
    date: "2025-01-15",
    status: "completed",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "PAY002",
    student: "Sarah Johnson",
    studentId: "STU002",
    amount: 500,
    feeType: "Tuition Fee",
    method: "Bank Transfer",
    date: "2025-01-14",
    status: "pending",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "PAY003",
    student: "Michael Brown",
    studentId: "STU003",
    amount: 950,
    feeType: "Tuition + Transport",
    method: "Cash",
    date: "2025-01-14",
    status: "completed",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "PAY004",
    student: "Emily Davis",
    studentId: "STU004",
    amount: 500,
    feeType: "Tuition Fee",
    method: "Credit Card",
    date: "2025-01-13",
    status: "failed",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "PAY005",
    student: "Daniel Wilson",
    studentId: "STU005",
    amount: 650,
    feeType: "Tuition + Sports",
    method: "UPI",
    date: "2025-01-12",
    status: "completed",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "PAY006",
    student: "Sophia Martinez",
    studentId: "STU006",
    amount: 500,
    feeType: "Tuition Fee",
    method: "Bank Transfer",
    date: "2025-01-11",
    status: "pending",
    avatar: "/placeholder.svg?height=40&width=40",
  },
]

const statusColors = {
  completed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-700",
}

export function PaymentsTable() {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transaction ID</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Fee Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-mono text-sm">{payment.id}</TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={payment.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {payment.student
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{payment.student}</p>
                    <p className="text-xs text-muted-foreground">{payment.studentId}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>{payment.feeType}</TableCell>
              <TableCell className="font-semibold">${payment.amount}</TableCell>
              <TableCell>{payment.method}</TableCell>
              <TableCell>{payment.date}</TableCell>
              <TableCell>
                <Badge className={statusColors[payment.status as keyof typeof statusColors]}>{payment.status}</Badge>
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
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Receipt className="mr-2 h-4 w-4" />
                      Download Receipt
                    </DropdownMenuItem>
                    {payment.status === "failed" && (
                      <DropdownMenuItem>
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Retry Payment
                      </DropdownMenuItem>
                    )}
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
