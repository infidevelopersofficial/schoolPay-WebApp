"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ExternalLink, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export function TenantsTable({ data }: { data: any[] }) {
  const { update } = useSession()
  const router = useRouter()
  const [isImpersonating, setIsImpersonating] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    state: "",
    adminEmail: "",
    adminPassword: "",
    plan: "STARTER",
    isDemo: false
  })

  const handleImpersonate = async (schoolId: string, schoolName: string) => {
    setIsImpersonating(schoolId)
    try {
      await update({ impersonateSchoolId: schoolId })
      toast.success(`Impersonating ${schoolName}`)
      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      toast.error("Failed to impersonate school")
      setIsImpersonating(null)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAdding(true)
    try {
      const res = await fetch("/api/super-admin/tenants/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        toast.success("School created successfully")
        setIsOpen(false)
        router.refresh()
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || "Failed to create school")
      }
    } catch (err) {
      toast.error("Network error")
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Input placeholder="Filter schools..." className="max-w-sm" />
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Add School</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add School Manually</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>School Name</Label>
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Plan</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={formData.plan} 
                    onChange={e => setFormData({...formData, plan: e.target.value})}
                  >
                    <option value="STARTER">Starter</option>
                    <option value="GROWTH">Growth</option>
                    <option value="PRO">Pro</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Admin Email</Label>
                <Input type="email" value={formData.adminEmail} onChange={e => setFormData({...formData, adminEmail: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Admin Password</Label>
                <Input type="password" value={formData.adminPassword} onChange={e => setFormData({...formData, adminPassword: e.target.value})} required />
              </div>
              <div className="flex items-center space-x-2">
                <Switch checked={formData.isDemo} onCheckedChange={c => setFormData({...formData, isDemo: c})} />
                <Label>Is Demo Account (30 Days)</Label>
              </div>
              <Button type="submit" className="w-full" disabled={isAdding}>
                {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create School"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-white dark:bg-slate-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((school) => (
              <TableRow key={school.id}>
                <TableCell className="font-mono text-xs">{school.schoolCode}</TableCell>
                <TableCell className="font-medium">
                  {school.name}
                  {school.isDemo && <Badge variant="secondary" className="ml-2 text-xs">DEMO</Badge>}
                </TableCell>
                <TableCell>{school.type}</TableCell>
                <TableCell>{school.plan}</TableCell>
                <TableCell>
                  <Badge variant={school.status === "Active" ? "default" : "destructive"}>
                    {school.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleImpersonate(school.id, school.name)}
                    disabled={isImpersonating === school.id}
                  >
                    {isImpersonating === school.id ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <ExternalLink className="w-3 h-3 mr-1" />
                    )}
                    Open as admin
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No schools found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
