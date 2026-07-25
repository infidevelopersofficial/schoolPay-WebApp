"use client"

import { useActionState, useState } from "react"
import { updateProfileAction, changePasswordAction } from "@/app/(dashboard)/dashboard/profile/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Phone, MapPin, Loader2, Shield } from "lucide-react"
import { useFormEffect } from "@/lib/hooks/use-form-effect"

interface ProfileUser {
  id: string
  name: string
  email: string | null
  phone: string | null
  avatar: string | null
  image: string | null
  role: string
  createdAt: string
}

interface ProfileFormClientProps {
  user: ProfileUser
  schoolName: string
  schoolAddress: string | null
  schoolPhone: string | null
}

export function ProfileFormClient({ user, schoolName, schoolAddress, schoolPhone }: ProfileFormClientProps) {
  const [profileState, profileAction, profilePending] = useActionState(updateProfileAction, null)
  const [passwordState, passwordAction, passwordPending] = useActionState(changePasswordAction, null)

  useFormEffect(profileState, {
    successMessage: "Profile updated successfully!",
  })

  useFormEffect(passwordState, {
    successMessage: "Password changed successfully!",
  })

  // Split name into first and last
  const nameParts = user.name?.split(" ") ?? [""]
  const firstName = nameParts[0] || ""
  const lastName = nameParts.slice(1).join(" ") || ""
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U"

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.avatar || user.image || undefined} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
                <p className="text-muted-foreground capitalize">{user.role?.toLowerCase()}</p>
                <p className="text-sm text-muted-foreground mt-2">{user.email || "No email"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="personal">Personal Information</TabsTrigger>
          <TabsTrigger value="contact">Contact Details</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={profileAction} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Full Name</Label>
                    <Input name="name" defaultValue={user.name} className="mt-1" required />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Avatar URL</Label>
                    <Input name="avatar" defaultValue={user.avatar || ""} placeholder="https://..." className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Role</Label>
                  <Input defaultValue={user.role} className="mt-1" disabled />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Member Since</Label>
                  <Input defaultValue={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"} className="mt-1" disabled />
                </div>
                {profileState?.error && (
                  <p className="text-sm text-destructive">{typeof profileState.error === "string" ? profileState.error : "Validation failed"}</p>
                )}
                <Button type="submit" className="w-full" disabled={profilePending}>
                  {profilePending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {profilePending ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{user.email || "Not set"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{user.phone || schoolPhone || "Not set"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">School</p>
                    <p className="text-sm text-muted-foreground">{schoolName}</p>
                    {schoolAddress && (
                      <p className="text-xs text-muted-foreground">{schoolAddress}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form action={passwordAction} className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Current Password</Label>
                  <Input name="currentPassword" type="password" className="mt-1" required />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">New Password</Label>
                  <Input name="newPassword" type="password" className="mt-1" required />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Confirm Password</Label>
                  <Input name="confirmPassword" type="password" className="mt-1" required />
                </div>
                {passwordState?.error && (
                  <p className="text-sm text-destructive">{typeof passwordState.error === "string" ? passwordState.error : "Validation failed"}</p>
                )}
                <Button type="submit" className="w-full" disabled={passwordPending}>
                  {passwordPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {passwordPending ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
