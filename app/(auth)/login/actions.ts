"use server"

import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"
import { checkRateLimit } from "@/lib/rate-limiter"
import { authLogger } from "@/lib/logger"
import { measureAsync, THRESHOLDS } from "@/lib/observability/performance"
import {
  addBreadcrumb,
  captureAuthError,
  setSentryAuthCtx,
} from "@/lib/observability/sentry-helpers"

/**
 * Server action for credential-based authentication.
 * Used by the login form via useActionState.
 *
 * Returns an error string on failure, or throws a redirect on success
 * (Auth.js internally throws NEXT_REDIRECT which Next.js handles).
 */
export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const identifier = ((formData.get("identifier") as string) || (formData.get("email") as string)) ?? ""

  return measureAsync(
    "auth.login",
    async () => {
      try {
        if (identifier) {
          const rateLimit = await checkRateLimit(`login_${identifier}`, 5)

          if (!rateLimit.success) {
            authLogger.warn({ identifier }, "Rate limit exceeded for login attempt")
            setSentryAuthCtx({ email: identifier, event: "rate_limited", remainingAttempts: 0 })
            addBreadcrumb("auth", "Login rate-limited", { identifier })
            return "Too many attempts. Please try again in 15 minutes."
          }

          addBreadcrumb("auth", "Login attempt", {
            identifier,
            remainingAttempts: rateLimit.remaining,
          })
          setSentryAuthCtx({ email: identifier, event: "login_attempt", remainingAttempts: rateLimit.remaining })
        }

        await signIn("credentials", formData)

        // signIn throws NEXT_REDIRECT on success — this line is unreachable on
        // the happy path but satisfies TypeScript's return-type analysis.
        authLogger.info({ identifier }, "Login succeeded")
        setSentryAuthCtx({ email: identifier, event: "login_success" })
        addBreadcrumb("auth", "Login successful", { identifier })
      } catch (error) {
        if (error instanceof AuthError) {
          switch (error.type) {
            case "CredentialsSignin":
              authLogger.warn({ identifier }, "Invalid credentials on login attempt")
              setSentryAuthCtx({ email: identifier, event: "login_failed" })
              addBreadcrumb("auth", "Login failed — invalid credentials", { identifier }, "warning")
              return "Invalid credentials."

            default:
              authLogger.error({ err: error, identifier }, "Unhandled AuthError during sign in")
              captureAuthError(error, { email: identifier, event: "login_failed" })
              return "Something went wrong. Please try again."
          }
        }
        // Re-throw non-auth errors (NEXT_REDIRECT, etc.)
        throw error
      }
    },
    { sentryOp: "auth.login", domain: "auth", thresholdMs: THRESHOLDS.AUTH_LOGIN },
  )
}
