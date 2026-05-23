const fs = require('fs');

let authFile = fs.readFileSync('lib/auth.ts', 'utf8');

authFile = authFile.replace(
`    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as { role?: string }).role

        // ── Multi-tenant: resolve the user's school memberships ────────`,
`    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as { role?: string }).role
        if ((user as any).isPendingActivation) {
          token.isPendingActivation = true;
          token.studentId = (user as any).studentId;
          token.activeSchoolId = (user as any).schoolId;
          token.schoolRole = "STUDENT";
          return token; // skip normal role resolution
        }

        // ── Multi-tenant: resolve the user's school memberships ────────`);

// Now add the dynamic validation check at the end of the jwt callback
authFile = authFile.replace(
`      // ── Allow school switching & silent refresh via session.update() ─────────
      if (trigger === "update" && session?.activeSchoolId) {
        token.activeSchoolId = session.activeSchoolId
      }

      return token
    },`,
`      // ── Allow school switching & silent refresh via session.update() ─────────
      if (trigger === "update" && session?.activeSchoolId) {
        token.activeSchoolId = session.activeSchoolId
      }

      // ── Dynamic DB Check for Suspended Students ─────────
      if (token.schoolRole === "STUDENT" && token.studentId) {
        try {
          const student = await prisma.student.findUnique({
            where: { id: token.studentId as string },
            select: { accountStatus: true, portalAccessEnabled: true }
          });
          if (!student || !student.portalAccessEnabled || student.accountStatus === 'SUSPENDED' || student.accountStatus === 'ARCHIVED') {
            throw new Error("Account suspended");
          }
        } catch(e) {
          return { ...token, error: "Suspended" };
        }
      }

      return token
    },`);

authFile = authFile.replace(
`    async session({ session, token }) {
      if (token?.sub) session.user.id = token.sub
      if (token?.role) session.user.role = token.role as any
      if (token?.activeSchoolId) session.user.activeSchoolId = token.activeSchoolId as string
      if (token?.schoolRole) session.user.schoolRole = token.schoolRole as string
      if (token?.tenantType) session.user.tenantType = token.tenantType as string
      if (token?.planTier) session.user.planTier = token.planTier as string
      if (token?.parentId) session.user.parentId = token.parentId as string
      if (token?.studentId) session.user.studentId = token.studentId as string

      return session
    },`,
`    async session({ session, token }) {
      if (token?.error === "Suspended") {
        // This will force the client to log out or handle the error
        session.error = "Suspended";
      }
      
      if (token?.sub) session.user.id = token.sub
      if (token?.role) session.user.role = token.role as any
      if (token?.activeSchoolId) session.user.activeSchoolId = token.activeSchoolId as string
      if (token?.schoolRole) session.user.schoolRole = token.schoolRole as string
      if (token?.tenantType) session.user.tenantType = token.tenantType as string
      if (token?.planTier) session.user.planTier = token.planTier as string
      if (token?.parentId) session.user.parentId = token.parentId as string
      if (token?.studentId) session.user.studentId = token.studentId as string
      if (token?.isPendingActivation) (session as any).isPendingActivation = true;

      return session
    },`);

fs.writeFileSync('lib/auth.ts', authFile);
console.log("Updated callbacks in auth.ts");
