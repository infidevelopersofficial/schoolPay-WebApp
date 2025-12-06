import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PaymentsTable } from "@/components/payments/payments-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Filter, Download } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { DollarSign, CheckCircle, Clock, XCircle } from "lucide-react"

const paymentStats = [
  { label: "Total Received", value: "$125,430", icon: DollarSign, color: "bg-primary/10 text-primary" },
  { label: "Successful", value: "342", icon: CheckCircle, color: "bg-green-100 text-green-600" },
  { label: "Pending", value: "56", icon: Clock, color: "bg-yellow-100 text-yellow-600" },
  { label: "Failed", value: "8", icon: XCircle, color: "bg-red-100 text-red-600" },
]

export default function PaymentsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Payments</h1>
            <p className="text-sm text-muted-foreground">Track and manage fee payments</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Record Payment
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {paymentStats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search payments..." className="pl-10" />
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

        {/* Payments Table */}
        <PaymentsTable />
      </div>
    </DashboardLayout>
  )
}
