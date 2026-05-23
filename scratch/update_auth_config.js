const fs = require('fs');

let config = fs.readFileSync('lib/auth.config.ts', 'utf8');

config = config.replace(
`        const user = auth?.user as {
          activeSchoolId?: string
          schoolRole?: string
          role?: string
          parentId?: string
          studentId?: string
        } | undefined`,
`        const user = auth?.user as {
          activeSchoolId?: string
          schoolRole?: string
          role?: string
          parentId?: string
          studentId?: string
          isPendingActivation?: boolean
        } | undefined`);

config = config.replace(
`        const isStudent  = user?.schoolRole === "STUDENT"`,
`        const isStudent  = user?.schoolRole === "STUDENT"
        const isPendingActivation = user?.isPendingActivation === true
        const isOnActivationRoute = pathname === "/student/activate"
        
        // ── Phase 5B.1: Activation Redirects ────────────────────────────────
        if (isStudent) {
          if (isPendingActivation && !isOnActivationRoute) {
            return Response.redirect(new URL("/student/activate", nextUrl))
          }
          if (!isPendingActivation && isOnActivationRoute) {
            return Response.redirect(new URL("/student/dashboard", nextUrl))
          }
        }`);

fs.writeFileSync('lib/auth.config.ts', config);
console.log("Updated auth.config.ts");
