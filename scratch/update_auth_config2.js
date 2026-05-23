const fs = require('fs');

let config = fs.readFileSync('lib/auth.config.ts', 'utf8');

config = config.replace(
`        session.user.studentId = token.studentId as string | undefined
      }
      return session`,
`        session.user.studentId = token.studentId as string | undefined
        ;(session.user as any).isPendingActivation = token.isPendingActivation === true
      }
      return session`);

fs.writeFileSync('lib/auth.config.ts', config);
console.log("Updated session in auth.config.ts");
