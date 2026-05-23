const fs = require('fs');

let activateActionsContent = fs.readFileSync('app/(student-portal)/student/activate/actions.ts', 'utf8');

activateActionsContent = activateActionsContent.replace(
  'import bcrypt from "bcryptjs"',
  'import bcrypt from "bcryptjs"\nimport { activationLockLimit } from "@/lib/ratelimit"'
);

activateActionsContent = activateActionsContent.replace(
`    const dobString = formData.get("dob") as string
    const newPassword = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (newPassword !== confirmPassword) {
      return { error: "Passwords do not match" }
    }
    if (newPassword.length < 8) {
      return { error: "Password must be at least 8 characters" }
    }

    if (student.dateOfBirth) {
      // Compare dates. We only care about YYYY-MM-DD
      const storedDate = student.dateOfBirth.toISOString().split("T")[0]
      if (storedDate !== dobString) {
        return { error: "Incorrect Date of Birth" }
      }
    }`,
`    const dobString = formData.get("dob") as string
    const newPassword = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (newPassword !== confirmPassword) {
      return { error: "Passwords do not match" }
    }
    if (newPassword.length < 8) {
      return { error: "Password must be at least 8 characters" }
    }

    if (student.dateOfBirth) {
      // Compare dates. We only care about YYYY-MM-DD
      const storedDate = student.dateOfBirth.toISOString().split("T")[0]
      if (storedDate !== dobString) {
        // Record failure in Redis rate limit
        const rlResult = await activationLockLimit.limit(\`activation:\${studentId}\`);
        
        await prisma.auditLog.create({
          data: {
            action: "STUDENT_ACTIVATION_FAILED",
            entityType: "Student",
            entityId: studentId,
            schoolId,
            userId: session.user.id
          }
        });

        if (!rlResult.success) {
          throw new Error("Too many failed activation attempts. Please try again in 15 minutes.");
        }

        return { error: "Incorrect Date of Birth" }
      }
    }`);

fs.writeFileSync('app/(student-portal)/student/activate/actions.ts', activateActionsContent);
console.log("Rewrote activate actions with rate limit.");
