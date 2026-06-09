"use client"

import { useState } from "react"
import { Plus, Download, Trash2, Calendar, FileText, CheckCircle2, DollarSign, TrendingUp, TrendingDown, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { createExpense, deleteExpense } from "./actions"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import Papa from "papaparse"

const EXPENSE_CATEGORIES = [
  "SALARY", "UTILITIES", "EVENTS", "MAINTENANCE", "SUPPLIES", "OTHER"
]

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658'];

export default function ExpensesClient({ expenses, stats, chartData }: { 
  expenses: any[],
  stats: any,
  chartData: any[]
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)

  const handleExport = () => {
    const csvData = expenses.map(e => ({
      Date: new Date(e.expenseDate).toLocaleDateString(),
      Category: e.category,
      Vendor: e.vendorName || '-',
      Description: e.description || '-',
      Amount: (e.amount / 100).toFixed(2),
      Recurring: e.isRecurring ? e.recurrenceType : 'No',
      CreatedBy: e.createdBy.name
    }))
    
    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `expenses_export_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    formData.append("isRecurring", isRecurring.toString())
    
    try {
      const res = await createExpense(formData)
      if (res.success) {
        toast.success("Expense recorded successfully")
        setIsModalOpen(false)
        e.currentTarget.reset()
      } else {
        toast.error("Failed to record expense", {
          description: JSON.stringify(res.error)
        })
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this expense?")) return
    try {
      const res = await deleteExpense(id)
      if (res.success) toast.success("Expense deleted")
      else toast.error(res.error)
    } catch (err: any) {
      toast.error(err.message || "An error occurred")
    }
  }

  return (
    <div className="space-y-8">
      {/* P&L Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Fees Collected (YTD)</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ₹{(stats.totalIncome / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Expenses (YTD)</CardTitle>
            <TrendingDown className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ₹{(stats.totalExpenses / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Net Surplus/Deficit</CardTitle>
            <DollarSign className={`h-4 w-4 ${stats.net >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.net >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              ₹{(stats.net / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg">Income vs Expenses (Monthly)</CardTitle>
            <CardDescription>Monthly comparison of collected fees and expenses</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `₹${(val/100000).toFixed(0)}k`} 
                />
                <RechartsTooltip 
                  cursor={{fill: '#1e293b'}}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                  formatter={(value: number) => [`₹${(value/100).toLocaleString('en-IN')}`, undefined]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg">Expenses by Category</CardTitle>
            <CardDescription>Distribution of expenses across categories</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {stats.categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="amount"
                    nameKey="category"
                  >
                    {stats.categoryBreakdown.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                    formatter={(value: number) => [`₹${(value/100).toLocaleString('en-IN')}`, undefined]}
                  />
                  <Legend 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    wrapperStyle={{ fontSize: '12px', color: '#f8fafc' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-500 text-sm">No expenses recorded yet.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expenses Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Expense Register</CardTitle>
            <CardDescription>All recorded expenses for the institution</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="h-9">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button size="sm" className="h-9 bg-blue-600 hover:bg-blue-700" onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Record Expense
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-800 rounded-lg">
              <FileText className="mx-auto h-10 w-10 text-slate-500 mb-2" />
              <p className="text-slate-400">No expenses found.</p>
              <Button variant="link" onClick={() => setIsModalOpen(true)} className="text-blue-400">
                Record your first expense
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 bg-slate-900 border-b border-slate-800 uppercase">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Vendor / Details</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-slate-800/20">
                      <td className="px-4 py-3 text-slate-300">
                        {new Date(expense.expenseDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-200">
                        {expense.category}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-200">{expense.vendorName || '-'}</div>
                        <div className="text-xs text-slate-500 line-clamp-1">{expense.description}</div>
                      </td>
                      <td className="px-4 py-3">
                        {expense.isRecurring ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400">
                            <Clock className="w-3 h-3" />
                            {expense.recurrenceType}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400">
                            ONE-TIME
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-rose-400">
                        ₹{(expense.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)} className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg bg-slate-900 border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <form onSubmit={handleSubmit}>
              <CardHeader className="border-b border-slate-800 pb-4">
                <CardTitle>Record Expense</CardTitle>
                <CardDescription>Enter the details of the new expense.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" name="expenseDate" required defaultValue={new Date().toISOString().split('T')[0]} className="bg-slate-950 border-slate-800" />
                  </div>
                  <div className="space-y-2">
                    <Label>Amount (₹)</Label>
                    <Input type="number" step="0.01" name="amount" required placeholder="0.00" className="bg-slate-950 border-slate-800" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select name="category" required>
                    <SelectTrigger className="bg-slate-950 border-slate-800">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      {EXPENSE_CATEGORIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Vendor / Payee Name (Optional)</Label>
                  <Input name="vendorName" placeholder="e.g. Amazon, local plumber..." className="bg-slate-950 border-slate-800" />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input name="description" placeholder="Brief details about the expense" className="bg-slate-950 border-slate-800" />
                </div>

                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Recurring Expense</Label>
                      <p className="text-sm text-slate-400">Auto-generate this expense in the future.</p>
                    </div>
                    <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
                  </div>
                  
                  {isRecurring && (
                    <div className="pt-2">
                      <Label className="text-xs mb-2 block">Recurrence Pattern</Label>
                      <Select name="recurrenceType" defaultValue="MONTHLY">
                        <SelectTrigger className="bg-slate-900 border-slate-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800">
                          <SelectItem value="MONTHLY">Monthly</SelectItem>
                          <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                          <SelectItem value="ANNUAL">Annually</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

              </CardContent>
              <div className="flex items-center justify-end gap-2 p-6 border-t border-slate-800">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                  {isSubmitting ? "Recording..." : "Record Expense"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
