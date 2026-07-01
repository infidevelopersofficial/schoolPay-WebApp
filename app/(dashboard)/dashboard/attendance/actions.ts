"use server"

import { auth } from "@/lib/auth"
import { markBulkAttendance, lockAttendanceRegister, BulkAttendanceInput } from "@/lib/dal/attendance"
import { withTenantAuth } from "@/lib/tenant-auth"

export async function saveAttendanceAction(data: BulkAttendanceInput) {
  try {
    return await withTenantAuth(null, ["ADMIN", "TEACHER"], async () => {
      const session = await auth();
      if (!session?.user) {
        throw new Error("Unauthorized")
      }

      const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN"
      return await markBulkAttendance(data, session.user.id, isAdmin);
    });
  } catch (e: any) {
    throw new Error(e.message || "Unauthorized");
  }
}

export async function lockAttendanceAction(batchId: string, date: string, lockReason?: string) {
  try {
    return await withTenantAuth(null, ["ADMIN", "TEACHER"], async () => {
      const session = await auth();
      if (!session?.user) {
        throw new Error("Unauthorized")
      }

      const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN"
      
      // If admin is locking/unlocking, enforce a reason
      if (isAdmin && !lockReason) {
        throw new Error("Admins must provide a reason for locking or modifying a register.")
      }

      return await lockAttendanceRegister(batchId, date, session.user.id, isAdmin, lockReason);
    });
  } catch (e: any) {
    throw new Error(e.message || "Unauthorized");
  }
}