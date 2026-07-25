"use client"

import { useActionState } from "react"
import { updateSchoolSettingsAction } from "@/app/(dashboard)/dashboard/settings/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { useFormEffect } from "@/lib/hooks/use-form-effect"

interface SchoolData {
  name: string
  address: string | null
  phone: string | null
  email: string | null
  currency: string
  timezone: string
  gstin: string | null
  state: string | null
}

interface SettingsFormClientProps {
  school: SchoolData
  activeSession: string | null
}

export function SettingsFormClient({ school, activeSession }: SettingsFormClientProps) {
  const [state, formAction, isPending] = useActionState(updateSchoolSettingsAction, null)

  useFormEffect(state, {
    successMessage: "Settings saved successfully!",
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage system preferences and configurations</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="fees">Fee Configuration</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={formAction} className="space-y-6">
                <div>
                  <Label className="text-sm text-muted-foreground">School Name</Label>
                  <Input name="name" defaultValue={school.name} className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Active Academic Session</Label>
                  <Input defaultValue={activeSession || "No active session"} className="mt-1" disabled />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Address</Label>
                  <Input name="address" defaultValue={school.address || ""} className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Phone</Label>
                    <Input name="phone" defaultValue={school.phone || ""} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Email</Label>
                    <Input name="email" type="email" defaultValue={school.email || ""} className="mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Currency</Label>
                    <Input name="currency" defaultValue={school.currency} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Timezone</Label>
                    <Input name="timezone" defaultValue={school.timezone} className="mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">GSTIN</Label>
                    <Input name="gstin" defaultValue={school.gstin || ""} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">State</Label>
                    <Input name="state" defaultValue={school.state || ""} className="mt-1" />
                  </div>
                </div>
                {state?.error && (
                  <p className="text-sm text-destructive">{typeof state.error === "string" ? state.error : "Validation failed"}</p>
                )}
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isPending ? "Saving..." : "Save Settings"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees">
          <Card>
            <CardHeader>
              <CardTitle>Fee Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm text-muted-foreground">Late Payment Fine (%)</Label>
                <Input type="number" defaultValue="5" className="mt-1" />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Grace Period (Days)</Label>
                <Input type="number" defaultValue="10" className="mt-1" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-muted-foreground">Enable Payment Reminders</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-muted-foreground">Enable Late Penalties</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-muted-foreground">Allow Partial Payments</Label>
                  <Switch defaultChecked />
                </div>
              </div>
              <Button disabled>Save Fee Settings</Button>
              <p className="text-xs text-muted-foreground">Fee configuration will be saved to SchoolSettings in a future update.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-muted-foreground">Email Notifications</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-muted-foreground">SMS Notifications</Label>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-muted-foreground">Payment Alerts</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-muted-foreground">Report Digests</Label>
                  <Switch defaultChecked />
                </div>
              </div>
              <Button disabled>Save Preferences</Button>
              <p className="text-xs text-muted-foreground">Notification preferences will be saved to SchoolSettings in a future update.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Payment Gateway</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Connect with payment processors for online fee collection
                    </p>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Email Service</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Set up email for system notifications and reports
                    </p>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">SMS Gateway</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Enable SMS notifications for important updates
                    </p>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
