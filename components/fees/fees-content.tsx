"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MoreHorizontal, Pencil, Trash2, Plus, Search, Filter, Download } from "lucide-react"
import { Input } from "@/components/ui/input"

interface FeeStructure {
  id: string
  name: string
  description?: string | null
  items: {
    id: string
    name: string
    amount: number
    frequency: string
  }[]
  mappings: {
    class: {
      name: string
      section: string
    }
  }[]
}


export function FeesContent({ feeStructures }: { feeStructures: FeeStructure[] }) {
  return (
    <Tabs defaultValue="fee-types" className="space-y-4">
      <TabsList>
        <TabsTrigger value="fee-types">Fee Structures</TabsTrigger>
        <TabsTrigger value="discounts">Discounts</TabsTrigger>
        <TabsTrigger value="penalties">Penalties</TabsTrigger>
      </TabsList>

      <TabsContent value="fee-types" className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search fee structures..." className="pl-10" />
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
                <TableHead>Structure Name</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Classes Mapped</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feeStructures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No fee structures found.
                  </TableCell>
                </TableRow>
              ) : feeStructures.map((structure) => (
                <TableRow key={structure.id}>
                  <TableCell>
                    <div className="font-medium">{structure.name}</div>
                    <div className="text-sm text-muted-foreground max-w-xs truncate">{structure.description}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {structure.items.map(item => (
                        <div key={item.id} className="text-sm">
                          {item.name}: <span className="font-semibold text-primary">₹{(item.amount / 100).toLocaleString()}</span> <Badge variant="outline" className="text-[10px] h-4 px-1">{item.frequency}</Badge>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {structure.mappings.length > 0 ? structure.mappings.map((m, idx) => (
                        <Badge key={idx} variant="secondary">
                          {m.class.name} {m.class.section}
                        </Badge>
                      )) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </div>
                  </TableCell>
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
          <Button className="gap-2" disabled>
            <Plus className="h-4 w-4" />
            Add Discount
          </Button>
        </div>

        <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-muted-foreground text-sm">
          No discounts configured. Discount management coming soon.
        </div>
      </TabsContent>

      <TabsContent value="penalties" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search penalties..." className="pl-10" />
          </div>
          <Button className="gap-2" disabled>
            <Plus className="h-4 w-4" />
            Add Penalty
          </Button>
        </div>

        <div className="flex h-40 items-center justify-center rounded-md border border-dashed text-muted-foreground text-sm">
          No penalties configured. Penalty management coming soon.
        </div>
      </TabsContent>
    </Tabs>
  )
}
