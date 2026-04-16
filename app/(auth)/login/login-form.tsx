"use client"

import { useActionState } from "react"
import { authenticate } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle } from "lucide-react"

export function LoginForm() {
  const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined)

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="login-email">Email address</Label>
        <Input
          id="login-email"
          name="email"
          type="email"
          placeholder="admin@school.com"
          required
          autoComplete="email"
          autoFocus
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          autoComplete="current-password"
          minLength={6}
          className="h-11"
        />
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      <Button type="submit" className="w-full h-11 text-base" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign in
      </Button>
    </form>
  )
}
