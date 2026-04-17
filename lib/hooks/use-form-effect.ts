"use client"

/**
 * useFormEffect
 *
 * Safely bridges `useActionState` results to toasts and callbacks.
 *
 * Problem this solves
 * -------------------
 * The naive pattern:
 *
 *   useEffect(() => {
 *     if (state?.success) { toast.success(...); onSuccess?.(); }
 *   }, [state, onOpenChange, onSuccess])
 *
 * causes an infinite loop because:
 *   1. onSuccess() (e.g. router.refresh()) re-renders the parent
 *   2. The parent creates new function instances for onOpenChange / onSuccess
 *   3. React sees the dep array changed → re-fires the effect
 *   4. Toast fires again → onSuccess() again → loop → page freeze
 *
 * Fix
 * ---
 * `useActionState` returns the SAME object reference across re-renders until
 * the next form submission.  We store the last-handled state in a ref and
 * skip processing when the reference hasn't changed.  This makes the effect
 * idempotent across spurious re-runs while still reacting to every new
 * action result.
 */

import { useEffect, useRef } from "react"
import { toast } from "sonner"

type FormState = {
  success?: boolean
  error?: string | Record<string, string[]>
} | null

interface UseFormEffectOptions {
  successMessage: string
  defaultErrorMessage?: string
  onSuccess?: () => void
  onOpenChange?: (open: boolean) => void
}

export function useFormEffect(state: FormState, options: UseFormEffectOptions) {
  const { successMessage, defaultErrorMessage = "Something went wrong", onSuccess, onOpenChange } =
    options

  // Tracks the last state object we already processed so that a re-run
  // triggered by changing callback props doesn't fire side-effects twice.
  const handledRef = useRef<FormState>(null)

  useEffect(() => {
    // Null = initial / reset state; skip.
    if (!state) return
    // Same object reference = already handled this action result; skip.
    if (state === handledRef.current) return

    handledRef.current = state

    if (state.success) {
      toast.success(successMessage)
      onOpenChange?.(false)
      onSuccess?.()
    } else if (state.error) {
      const message =
        typeof state.error === "string" ? state.error : defaultErrorMessage
      toast.error(message)
    }
  }, [state, successMessage, defaultErrorMessage, onSuccess, onOpenChange])
}
