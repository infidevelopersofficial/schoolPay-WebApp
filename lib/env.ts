/**
 * Startup Environment Validation
 *
 * Called ONCE from `instrumentation.ts` at server cold-start (Node.js runtime
 * only). Validates that every required environment variable is present and
 * structurally valid BEFORE the server starts accepting requests.
 *
 * Why validate here instead of at each call site?
 * - Misconfigured deployments fail immediately with a human-readable error
 *   instead of serving broken pages for minutes before someone notices.
 * - Keeps every consumer free from defensive null-checks on process.env.
 * - Sentry / logger are NOT available yet when this runs (they need env vars
 *   themselves), so we write directly to stderr and exit.
 */

// ─── Schema ───────────────────────────────────────────────────────────────────

interface EnvVar {
  /** Environment variable name */
  key: string
  /** Human-readable description shown in the error message */
  description: string
  /** If true, the absence blocks startup. If false, it is a logged warning. */
  required: boolean
  /** Optional regex the value must satisfy */
  pattern?: RegExp
  /** Minimum string length */
  minLength?: number
}

const ENV_SCHEMA: EnvVar[] = [
  // Database
  {
    key: "DATABASE_URL",
    description: "PostgreSQL connection string",
    required: true,
    pattern: /^postgresql:\/\/.+/,
  },
  // Authentication
  {
    key: "AUTH_SECRET",
    description: "NextAuth.js session signing secret",
    required: true,
    minLength: 32,
  },
  // Observability (optional but warn loudly so operators know what they're missing)
  {
    key: "NEXT_PUBLIC_SENTRY_DSN",
    description: "Sentry DSN — error tracking will be disabled without this",
    required: false,
    pattern: /^https:\/\/.+\.ingest\.(sentry|us\.sentry)\.io\/.+/,
  },
]

// ─── Validator ────────────────────────────────────────────────────────────────

interface ValidationResult {
  errors: string[]
  warnings: string[]
}

function validateEnv(): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  for (const spec of ENV_SCHEMA) {
    const value = process.env[spec.key]

    if (!value || value.trim() === "") {
      const message = `${spec.key} is not set — ${spec.description}`
      if (spec.required) {
        errors.push(message)
      } else {
        warnings.push(message)
      }
      continue
    }

    if (spec.minLength && value.length < spec.minLength) {
      errors.push(
        `${spec.key} is too short (${value.length} chars, minimum ${spec.minLength}) — ${spec.description}`,
      )
    }

    if (spec.pattern && !spec.pattern.test(value)) {
      errors.push(
        `${spec.key} has an unexpected format — ${spec.description}`,
      )
    }
  }

  return { errors, warnings }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Run environment validation.
 *
 * - Warnings are written to stderr but do not stop startup.
 * - Errors are written to stderr and throw so the caller (instrumentation.ts)
 *   can decide whether to exit or let Next.js surface the error.
 *
 * In production, a missing required var should halt deployment immediately.
 * In development, we throw so the developer sees the error in the terminal.
 */
export function assertEnv(): void {
  const { errors, warnings } = validateEnv()

  for (const w of warnings) {
    process.stderr.write(`[schoolpay] WARN  env: ${w}\n`)
  }

  if (errors.length > 0) {
    const lines = [
      "",
      "╔══════════════════════════════════════════════════════════════╗",
      "║         SchoolPay — ENVIRONMENT MISCONFIGURATION             ║",
      "╠══════════════════════════════════════════════════════════════╣",
      ...errors.map((e) => `║  ✗ ${e.padEnd(59)}║`),
      "╠══════════════════════════════════════════════════════════════╣",
      "║  Copy .env.example → .env and fill in the missing values.   ║",
      "╚══════════════════════════════════════════════════════════════╝",
      "",
    ]
    for (const line of lines) process.stderr.write(line + "\n")

    // Exit in production so a misconfigured deployment doesn't serve broken
    // pages. In development throw so the hot-reload cycle surfaces the error.
    if (process.env.NODE_ENV === "production") {
      process.exit(1)
    } else {
      throw new Error(
        `Environment misconfiguration — fix the following before starting:\n  • ${errors.join("\n  • ")}`,
      )
    }
  }
}
