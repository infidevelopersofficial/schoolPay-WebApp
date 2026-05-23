const fs = require('fs');

let authTsContent = fs.readFileSync('lib/auth.ts', 'utf8');

// Add import for rate limit
authTsContent = authTsContent.replace(
  'import { authConfig } from "./auth.config"',
  'import { authConfig } from "./auth.config"\nimport { accountBruteForceLimit } from "./ratelimit"'
);

// We need to rewrite the authorize function slightly for the new logic
authTsContent = authTsContent.replace(
`        try {
          const identifier = credentials.identifier as string;
          const schoolCode = credentials.schoolCode as string | undefined;
          
          let user = null;
          let isPendingActivation = false;

          if (schoolCode) {`,
`        try {
          const identifier = credentials.identifier as string;
          const schoolCode = credentials.schoolCode as string | undefined;
          
          let user = null;
          let isPendingActivation = false;

          if (schoolCode) {
            // Rate Limit Check
            const ratelimitKey = \`auth:\${schoolCode}:\${identifier}\`;
            const rlResult = await accountBruteForceLimit.limit(ratelimitKey);
            if (!rlResult.success) {
              authLogger.warn({ schoolCode, identifier }, "Distributed brute force block triggered.");
              throw new Error("Too many login attempts. Please try again later.");
            }
`);

// The user requested generic errors for student login attempts.
// "Never reveal whether School Code exists, Admission Number exists, Student account exists, Account is suspended. Use a single generic authentication failure message."

// Replace the specific failures with a generic error (returning null makes NextAuth throw generic "CredentialsSignin")
authTsContent = authTsContent.replace(
`            if (!student.portalAccessEnabled) {
              authLogger.warn({ studentId: student.id }, "Student attempted login but portal access is disabled.");
              return null;
            }

            if (student.accountStatus === "SUSPENDED" || student.accountStatus === "ARCHIVED") {
              authLogger.warn({ studentId: student.id, status: student.accountStatus }, "Login attempt by suspended/archived student.");
              return null;
            }

            // Brute force check
            if (student.lockedUntil && student.lockedUntil > new Date()) {
              authLogger.warn({ studentId: student.id }, "Login attempt for locked student account.");
              throw new Error("Account is temporarily locked. Try again later.");
            }`,
`            if (!student.portalAccessEnabled) {
              authLogger.warn({ studentId: student.id }, "Student attempted login but portal access is disabled.");
              throw new Error("Invalid credentials or account is suspended.");
            }

            if (student.accountStatus === "SUSPENDED" || student.accountStatus === "ARCHIVED") {
              authLogger.warn({ studentId: student.id, status: student.accountStatus }, "Login attempt by suspended/archived student.");
              throw new Error("Invalid credentials or account is suspended.");
            }

            // Database brute force check (still enforced in addition to Redis)
            if (student.lockedUntil && student.lockedUntil > new Date()) {
              authLogger.warn({ studentId: student.id }, "Login attempt for locked student account.");
              throw new Error("Invalid credentials or account is suspended.");
            }`);

authTsContent = authTsContent.replace(
`              if (student.tempPasswordExpiresAt < new Date()) {
                throw new Error("Temporary password has expired. Please contact administration.");
              }`,
`              if (student.tempPasswordExpiresAt < new Date()) {
                authLogger.warn({ studentId: student.id }, "Expired temp password attempt.");
                throw new Error("Invalid credentials or account is suspended.");
              }`);

// "if (!student) return null;" should throw generic error or return null? Returning null throws generic "CredentialsSignin" anyway. But let's explicitly throw.
authTsContent = authTsContent.replace(
`            const student = await prisma.student.findFirst({
              where: {
                admissionNumber: identifier,
                school: { slug: schoolCode }
              },
              include: { user: true }
            });

            if (!student) return null;`,
`            const student = await prisma.student.findFirst({
              where: {
                admissionNumber: identifier,
                school: { slug: schoolCode }
              },
              include: { user: true }
            });

            if (!student) {
              // Generic error to prevent enumeration
              throw new Error("Invalid credentials or account is suspended.");
            }`);

// For invalid password:
authTsContent = authTsContent.replace(
`                await prisma.student.update({
                  where: { id: student.id },
                  data: { failedLoginAttempts: newAttempts, lockedUntil }
                });
                return null;
              }`,
`                await prisma.student.update({
                  where: { id: student.id },
                  data: { failedLoginAttempts: newAttempts, lockedUntil }
                });
                throw new Error("Invalid credentials or account is suspended.");
              }`);

fs.writeFileSync('lib/auth.ts', authTsContent);
console.log("Rewrote lib/auth.ts with generic errors and rate limiting.");
