import { getTenantContext } from "@/lib/tenant-context"
import { tenantContext } from "@/lib/prisma"

/**
 * Data Access Layer (DAL) Wrapper for Server Components
 * Ensures that read operations are executed within the AsyncLocalStorage
 * context, enforcing the Prisma Client Extension RLS globally.
 */
export async function withTenantRead<T>(
  action: (schoolId: string) => Promise<T>
): Promise<T> {
  const { schoolId } = await getTenantContext()
  
  // Initialize the RLS context and execute the read queries
  return tenantContext.run({ schoolId }, () => {
    return action(schoolId)
  })
}
