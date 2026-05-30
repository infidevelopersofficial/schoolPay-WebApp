"use server"

import { auth } from "@/lib/auth"
import { markBulkAttendance, lockAttendanceRegister, BulkAttendanceInput } from "@/lib/dal/attendance"

export async function saveAttendanceAction(data: BulkAttendanceInput) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN"
  return markBulkAttendance(data, session.user.id, isAdmin);
}

export async function lockAttendanceAction(batchId: string, date: string, lockReason?: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN"
  
  // If admin is locking/unlocking, enforce a reason
  if (isAdmin && !lockReason) {
    throw new Error("Admins must provide a reason for locking or modifying a register.")
  }

  return lockAttendanceRegister(batchId, date, session.user.id, isAdmin, lockReason);
}