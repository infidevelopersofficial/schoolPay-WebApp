import { Card, CardContent } from "@/components/ui/card"
import { DollarSign, TrendingUp, Clock, AlertTriangle } from "lucide-react"

const stats = [
  {
    title: "Total Fees Collected",
    value: "$245,890",
    change: "+12.5%",
    changeType: "positive",
    icon: DollarSign,
    color: "bg-green-100 text-green-600",
  },
  {
    title: "Pending Fees",
    value: "$45,230",
    change: "152 students",
    changeType: "neutral",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-600",
  },
  {
    title: "Overdue Fees",
    value: "$12,450",
    change: "34 students",
    changeType: "negative",
    icon: AlertTriangle,
    color: "bg-red-100 text-red-600",
  },
  {
    title: "Collection Rate",
    value: "87.5%",
    change: "+5.2% from last month",
    changeType: "positive",
    icon: TrendingUp,
    color: "bg-blue-100 text-blue-600",
  },
]

export function FeeStatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                <p
                  className={`text-xs mt-1 ${
                    stat.changeType === "positive"
                      ? "text-green-600"
                      : stat.changeType === "negative"
                        ? "text-red-600"
                        : "text-muted-foreground"
                  }`}
                >
                  {stat.change}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
