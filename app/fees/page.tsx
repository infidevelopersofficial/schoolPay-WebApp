"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter, Download, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AddFeeForm } from "@/components/forms"

const feeTypes = [
  { id: "FEE001", type: "Tuition Fee", amount: 3000, description: "Regular tuition fees for academic instruction", frequency: "Monthly", dueDate: "5th of every month", applicableClasses: ["All"] },
  { id: "FEE002", type: "Laboratory Fee", amount: 500, description: "Laboratory and science equipment usage", frequency: "Quarterly", dueDate: "15th of quarter start", applicableClasses: ["9-12"] },
  { id: "FEE003", type: "Sports Fee", amount: 300, description: "Sports activities and equipment", frequency: "Yearly", dueDate: "April 1st", applicableClasses: ["All"] },
  { id: "FEE004", type: "Transport Fee", amount: 800, description: "School bus transportation", frequency: "Monthly", dueDate: "1st of every month", applicableClasses: ["All"] },
  { id: "FEE005", type: "Technology Fee", amount: 400, description: "IT infrastructure and computer lab", frequency: "Yearly", dueDate: "April 1st", applicableClasses: ["All"] },
  { id: "FEE006", type: "Development Fee", amount: 500, description: "School infrastructure development", frequency: "Yearly", dueDate: "April 1st", applicableClasses: ["All"] },
]

const discounts = [
  { id: "DIS001", name: "Sibling Discount", percentage: 10, description: "10% discount for second child onwards", applicableTo: "Tuition Fee" },
  { id: "DIS002", name: "Merit Scholarship", percentage: 25, description: "25% discount for students with 90%+ marks", applicableTo: "Tuition Fee" },
  { id: "DIS003", name: "Early Payment", percentage: 5, description: "5% discount for payment before due date", applicableTo: "All Fees" },
  { id: "DIS004", name: "Staff Child", percentage: 50, description: "50% discount for staff children", applicableTo: "All Fees" },
]

const penalties = [
  { id: "PEN001", name: "Late Payment", amount: 100, description: "₹100 penalty after 10 days of due date", applicableTo: "All Fees" },
  { id: "PEN002", name: "Bounced Cheque", amount: 500, description: "₹500 penalty for bounced cheques", applicableTo: "All Fees" },
  { id: "PEN003", name: "Overdue (30 days)", amount: 200, description: "Additional ₹200 after 30 days overdue", applicableTo: "All Fees" },
]

export default function FeesPage() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Fee Management</h1>
            <p className="text-sm text-muted-foreground">Manage fee structure, discounts, and penalties</p>
          </div>
          <Button className="gap-2" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4" />
            Add Fee Type
          </Button>
        </div>

        <AddFeeForm open={showAddForm} onOpenChange={setShowAddForm} onSuccess={() => setRefreshKey(prev => prev + 1)} />

        <Tabs defaultValue="fee-types" className="space-y-4" key={refreshKey}>
          <TabsList>
            <TabsTrigger value="fee-types">Fee Types</TabsTrigger>
            <TabsTrigger value="discounts">Discounts</TabsTrigger>
            <TabsTrigger value="penalties">Penalties</TabsTrigger>
          </TabsList>

          <TabsContent value="fee-types" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search fee types..." className="pl-10" />
              </div>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fee ID</TableHead>
                    <TableHead>Fee Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeTypes.map((fee) => (
                    <TableRow key={fee.id}>
                      <TableCell className="font-mono text-sm">{fee.id}</TableCell>
                      <TableCell className="font-medium">{fee.type}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-primary">₹{fee.amount}</span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{fee.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{fee.frequency}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{fee.dueDate}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
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
          </TabsContent>

          <TabsContent value="discounts" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search discounts..." className="pl-10" />
              </div>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Discount
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {discounts.map((discount) => (
                <Card key={discount.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{discount.name}</CardTitle>
                        <Badge className="mt-2 bg-green-100 text-green-700 hover:bg-green-100">
                          {discount.percentage}% OFF
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">{discount.description}</p>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Applicable to: </span>
                      <span className="font-medium">{discount.applicableTo}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="penalties" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search penalties..." className="pl-10" />
              </div>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Penalty
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {penalties.map((penalty) => (
                <Card key={penalty.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{penalty.name}</CardTitle>
                        <Badge className="mt-2 bg-red-100 text-red-700 hover:bg-red-100">
                          ₹{penalty.amount} Penalty
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">{penalty.description}</p>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Applicable to: </span>
                      <span className="font-medium">{penalty.applicableTo}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
