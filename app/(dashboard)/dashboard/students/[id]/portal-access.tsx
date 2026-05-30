"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { generateStudentCredentials, suspendStudentAccess, reactivateStudentAccess } from "../portal-actions"
import { Loader2, Copy, AlertTriangle, ShieldCheck } from "lucide-react"

export function PortalAccessCard({ student }: { student: any }) {
  const [loading, setLoading] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!confirm("Generate new credentials? This will invalidate any existing temporary password.")) return;
    setLoading(true)
    try {
      const res = await generateStudentCredentials(student.id)
      setTempPassword(res.rawPassword)
    } catch (e) {
      alert("Failed to generate credentials")
    } finally {
      setLoading(false)
    }
  }

  const handleSuspend = async () => {
    if (!confirm("Are you sure you want to suspend this student's portal access?")) return;
    setLoading(true)
    try {
      await suspendStudentAccess(student.id)
    } finally {
      setLoading(false)
    }
  }

  const handleReactivate = async () => {
    setLoading(true)
    try {
      await reactivateStudentAccess(student.id)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword)
      alert("Copied to clipboard!")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Portal Access
          <Badge variant={
            student.accountStatus === 'ACTIVE' ? 'default' : 
            student.accountStatus === 'PENDING_ACTIVATION' ? 'secondary' : 'destructive'
          }>
            {student.accountStatus}
          </Badge>
        </CardTitle>
        <CardDescription>Manage student access to the student portal.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {tempPassword ? (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-amber-500 font-medium">
              <AlertTriangle className="h-4 w-4" />
              Temporary Credentials Generated
            </div>
            <p className="text-sm text-muted-foreground">
              Please share these credentials securely. This password will not be shown again and expires in 7 days.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <code className="px-3 py-2 bg-black/20 rounded font-mono text-lg tracking-wider">
                {tempPassword}
              </code>
              <Button variant="outline" size="icon" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(!student.portalAccessEnabled || student.accountStatus === 'PENDING_ACTIVATION') && (
              <Button onClick={handleGenerate} disabled={loading} variant="default">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {student.portalAccessEnabled ? "Regenerate Credentials" : "Generate Credentials"}
              </Button>
            )}

            {student.accountStatus === 'ACTIVE' && (
              <Button onClick={handleGenerate} disabled={loading} variant="outline">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reset Password
              </Button>
            )}

            {student.accountStatus === 'SUSPENDED' && (
              <Button onClick={handleReactivate} disabled={loading} variant="outline">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reactivate Access
              </Button>
            )}

            {(student.accountStatus === 'ACTIVE' || student.accountStatus === 'PENDING_ACTIVATION') && student.portalAccessEnabled && (
              <Button onClick={handleSuspend} disabled={loading} variant="destructive">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Suspend Access
              </Button>
            )}
          </div>
        )}

        {student.lockedUntil && new Date(student.lockedUntil) > new Date() && (
          <div className="text-sm text-destructive flex items-center gap-2 mt-2">
            <ShieldCheck className="h-4 w-4" /> Account temporarily locked due to failed login attempts.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
