const fs = require('fs');

let authFile = fs.readFileSync('lib/auth.ts', 'utf8');

authFile = authFile.replace(
`        // ── Defensive wrapper ──────────────────────────────────────────────
        try {
          const identifier = credentials.identifier as string;
          const schoolCode = credentials.schoolCode as string | undefined;
          
          let user = null;

          // Strategy 1: If schoolCode is provided, this is a Student Login attempting via Admission Number
          if (schoolCode) {
            const student = await prisma.student.findFirst({
              where: {
                admissionNumber: identifier,
                school: { slug: schoolCode } // Assuming schoolCode maps to slug or tenantId
              },
              include: { user: true }
            });
            if (student?.user) {
              user = student.user;
            }
          }

          // Strategy 2: If no user found yet, try finding by Email or Phone globally
          if (!user) {
            user = await prisma.user.findFirst({
              where: {
                OR: [
                  { email: identifier },
                  { phone: identifier }
                ]
              }
            });
          }

          if (!user?.hashedPassword) return null

          const isValidPassword = await bcrypt.compare(
            credentials.password as string,
            user.hashedPassword,
          )

          if (!isValidPassword) return null

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.avatar,
          }`,
`        // ── Defensive wrapper ──────────────────────────────────────────────
        try {
          const identifier = credentials.identifier as string;
          const schoolCode = credentials.schoolCode as string | undefined;
          
          let user = null;

          // Strategy 1: If schoolCode is provided, this is a Student Login attempting via Admission Number
          if (schoolCode) {
            const student = await prisma.student.findFirst({
              where: {
                admissionNumber: identifier,
                school: { slug: schoolCode }
              },
              include: { user: true }
            });
            
            if (student) {
              if (!student.portalAccessEnabled) return null;
              if (student.accountStatus === 'SUSPENDED' || student.accountStatus === 'ARCHIVED') return null;
              
              if (student.lockedUntil && student.lockedUntil > new Date()) {
                throw new Error("Account is temporarily locked. Try again later.");
              }

              if (student.accountStatus === 'PENDING_ACTIVATION') {
                if (!student.tempPasswordHash) return null;
                const isValidTemp = await bcrypt.compare(credentials.password as string, student.tempPasswordHash);
                
                if (!isValidTemp) {
                  await prisma.student.update({
                    where: { id: student.id },
                    data: {
                      failedLoginAttempts: { increment: 1 },
                      lockedUntil: student.failedLoginAttempts >= 4 ? new Date(Date.now() + 15 * 60 * 1000) : null
                    }
                  });
                  return null;
                }
                
                if (student.tempPasswordExpiresAt && student.tempPasswordExpiresAt < new Date()) {
                  throw new Error("Temporary password has expired.");
                }

                // Temporary Activation User Session
                return {
                  id: "pending-" + student.id,
                  name: student.name,
                  role: "STUDENT",
                  isPendingActivation: true,
                  studentId: student.id,
                  schoolId: student.schoolId
                }
              }
              
              // If ACTIVE, expect a linked user record
              if (student.user) {
                user = student.user;
              } else {
                return null;
              }
            }
          }

          // Strategy 2: If no user found yet, try finding by Email or Phone globally
          if (!user) {
            user = await prisma.user.findFirst({
              where: {
                OR: [
                  { email: identifier },
                  { phone: identifier }
                ]
              }
            });
          }

          if (!user?.hashedPassword) return null

          const isValidPassword = await bcrypt.compare(
            credentials.password as string,
            user.hashedPassword,
          )

          if (!isValidPassword) return null

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.avatar,
          }`);

fs.writeFileSync('lib/auth.ts', authFile);
console.log("Updated auth.ts");
