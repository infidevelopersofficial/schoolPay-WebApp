"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye, Edit, FileText } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { DataTableExport } from "@/components/ui/data-table-export"
import { TableEmptyState } from "@/components/ui/table-empty-state"

const statusColors = {
  PAID: "bg-green-100 text-green-700",
  DRAFT: "bg-gray-100 text-gray-700",
  SENT: "bg-blue-100 text-blue-700",
  OVERDUE: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
}

interface InvoicesTableProps {
  invoices: any[]
}

export function InvoicesTable({ invoices }: InvoicesTableProps) {
  if (invoices.length === 0) {
    return (
      <TableEmptyState
        icon={FileText}
        title="No invoices found"
        description="No invoices match your current filters. Try adjusting the search or create a new invoice."
        addHref="/dashboard/invoices/new"
        addLabel="New Invoice"
      />
    )
  }

  return (
    <Card>
      <div className="p-4 flex justify-end items-center border-b">
        <DataTableExport 
          filename="Invoices_Export" 
          data={invoices} 
          columns={[
          { header: "Invoice No", key: "invoiceNo" },
          { header: "Student", key: (r) => r.student?.name || "" },
          { header: "Class", key: (r) => r.student?.class || "" },
          { header: "Amount", key: "total" },
          { header: "Status", key: "status" },
          { header: "Due Date", key: (r) => new Date(r.dueDate).toLocaleDateString() }
        ]} 
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice No</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium text-foreground">{invoice.invoiceNo}</TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{invoice.student?.name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{invoice.student?.class || "—"}</p>
                </div>
              </TableCell>
              <TableCell className="font-semibold">₹{invoice.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
              <TableCell>
                <Badge className={statusColors[invoice.status as keyof typeof statusColors] || statusColors.DRAFT}>
                  {invoice.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(invoice.dueDate).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/invoices/${invoice.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </DropdownMenuItem>
                    {invoice.status === "DRAFT" && (
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
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
