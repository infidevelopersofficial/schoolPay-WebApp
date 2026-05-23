const fs = require('fs');

let actions = fs.readFileSync('app/(dashboard)/students/portal-actions.ts', 'utf8');

actions = actions.replace(/export const generateStudentCredentials = withTenantAuth\(\["ADMIN", "SUPER_ADMIN"\]\)\(\n  async \(\{ schoolId, userId \}, studentId: string\) => \{/g,
  `export async function generateStudentCredentials(studentId: string) {
  return withTenantAuth(null, ["ADMIN", "SUPER_ADMIN"], async (config, schoolId) => {
    const session = await import("@/lib/auth").then(m => m.auth());
    const userId = session?.user?.id;
    if (!userId) throw new Error("Unauthorized");`);

actions = actions.replace(/      revalidatePath\(\`\/students\/\${studentId}\`\);\n      return \{ rawPassword \};\n    \}\n  \);\n/g,
  `    revalidatePath(\`/students/\${studentId}\`);
    return { rawPassword };
  });
}
`);

actions = actions.replace(/export const suspendStudentAccess = withTenantAuth\(\["ADMIN", "SUPER_ADMIN"\]\)\(\n  async \(\{ schoolId, userId \}, studentId: string\) => \{/g,
  `export async function suspendStudentAccess(studentId: string) {
  return withTenantAuth(null, ["ADMIN", "SUPER_ADMIN"], async (config, schoolId) => {
    const session = await import("@/lib/auth").then(m => m.auth());
    const userId = session?.user?.id;
    if (!userId) throw new Error("Unauthorized");`);

actions = actions.replace(/      revalidatePath\(\`\/students\/\${studentId}\`\);\n    \}\n  \);\n/g,
  `    revalidatePath(\`/students/\${studentId}\`);
  });
}
`);

actions = actions.replace(/export const reactivateStudentAccess = withTenantAuth\(\["ADMIN", "SUPER_ADMIN"\]\)\(\n  async \(\{ schoolId, userId \}, studentId: string\) => \{/g,
  `export async function reactivateStudentAccess(studentId: string) {
  return withTenantAuth(null, ["ADMIN", "SUPER_ADMIN"], async (config, schoolId) => {
    const session = await import("@/lib/auth").then(m => m.auth());
    const userId = session?.user?.id;
    if (!userId) throw new Error("Unauthorized");`);

actions = actions.replace(/export const bulkGenerateStudentCredentials = withTenantAuth\(\["ADMIN", "SUPER_ADMIN"\]\)\(\n  async \(\{ schoolId, userId \}, studentIds: string\[\]\) => \{/g,
  `export async function bulkGenerateStudentCredentials(studentIds: string[]) {
  return withTenantAuth(null, ["ADMIN", "SUPER_ADMIN"], async (config, schoolId) => {
    const session = await import("@/lib/auth").then(m => m.auth());
    const userId = session?.user?.id;
    if (!userId) throw new Error("Unauthorized");`);

actions = actions.replace(/      revalidatePath\("\/students"\);\n      return csvContent;\n    \}\n  \);\n/g,
  `    revalidatePath("/students");
    return csvContent;
  });
}
`);

fs.writeFileSync('app/(dashboard)/students/portal-actions.ts', actions);
console.log("Fixed portal-actions.ts signature");
