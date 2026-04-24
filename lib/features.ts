/**
 * Feature Flags — Tenant-Type & Plan-Based Feature Gating
 *
 * Controls which modules are available based on:
 * 1. TenantType (SCHOOL | COACHING_CENTER | PRIVATE_TUTOR)
 * 2. PlanTier (FREE | STARTER | PROFESSIONAL | ENTERPRISE)
 *
 * Usage (Server Component):
 *   const features = getTenantFeatures("SCHOOL", "FREE")
 *   if (features.invoicing) { ... }
 *
 * Usage (Client hook — see hooks/use-features.ts):
 *   const features = useFeatures()
 */

export type TenantType = "SCHOOL" | "COACHING_CENTER" | "PRIVATE_TUTOR"
export type PlanTier = "FREE" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE"

export interface TenantFeatures {
  // Core modules
  studentManagement: boolean
  teacherManagement: boolean
  parentPortal: boolean
  classManagement: boolean     // traditional grade/section — schools only
  batchManagement: boolean     // flexible batches — all tenant types
  subjectManagement: boolean

  // Financial
  feeManagement: boolean       // structured fee schedules — schools
  invoicing: boolean           // line-item invoices — coaching + tutors
  paymentCollection: boolean

  // Academic
  attendance: boolean
  examResults: boolean
  lessonPlanning: boolean

  // Communication
  messaging: boolean
  announcements: boolean
  events: boolean

  // Advanced
  reports: boolean
  auditLog: boolean
  payroll: boolean             // schools + large coaching centers only
  admissions: boolean          // schools + coaching centers
  multiTeacher: boolean        // more than one instructor
  onlineClassLinks: boolean

  // Limits
  maxStudents: number          // -1 = unlimited
  maxStaff: number             // -1 = unlimited
  storageGb: number
}

// ─── Feature Matrix ─────────────────────────────────────────────────────────

type FeatureMatrix = Record<TenantType, Record<PlanTier, TenantFeatures>>

const FEATURES: FeatureMatrix = {
  SCHOOL: {
    FREE: {
      studentManagement: true,
      teacherManagement: true,
      parentPortal: true,
      classManagement: true,
      batchManagement: false,
      subjectManagement: true,
      feeManagement: true,
      invoicing: false,
      paymentCollection: true,
      attendance: true,
      examResults: true,
      lessonPlanning: false,
      messaging: false,
      announcements: true,
      events: true,
      reports: false,
      auditLog: false,
      payroll: false,
      admissions: false,
      multiTeacher: true,
      onlineClassLinks: false,
      maxStudents: 50,
      maxStaff: 5,
      storageGb: 1,
    },
    STARTER: {
      studentManagement: true,
      teacherManagement: true,
      parentPortal: true,
      classManagement: true,
      batchManagement: false,
      subjectManagement: true,
      feeManagement: true,
      invoicing: false,
      paymentCollection: true,
      attendance: true,
      examResults: true,
      lessonPlanning: true,
      messaging: true,
      announcements: true,
      events: true,
      reports: true,
      auditLog: false,
      payroll: false,
      admissions: true,
      multiTeacher: true,
      onlineClassLinks: false,
      maxStudents: 300,
      maxStaff: 20,
      storageGb: 5,
    },
    PROFESSIONAL: {
      studentManagement: true,
      teacherManagement: true,
      parentPortal: true,
      classManagement: true,
      batchManagement: true,
      subjectManagement: true,
      feeManagement: true,
      invoicing: false,
      paymentCollection: true,
      attendance: true,
      examResults: true,
      lessonPlanning: true,
      messaging: true,
      announcements: true,
      events: true,
      reports: true,
      auditLog: true,
      payroll: true,
      admissions: true,
      multiTeacher: true,
      onlineClassLinks: true,
      maxStudents: 1000,
      maxStaff: 100,
      storageGb: 20,
    },
    ENTERPRISE: {
      studentManagement: true,
      teacherManagement: true,
      parentPortal: true,
      classManagement: true,
      batchManagement: true,
      subjectManagement: true,
      feeManagement: true,
      invoicing: true,
      paymentCollection: true,
      attendance: true,
      examResults: true,
      lessonPlanning: true,
      messaging: true,
      announcements: true,
      events: true,
      reports: true,
      auditLog: true,
      payroll: true,
      admissions: true,
      multiTeacher: true,
      onlineClassLinks: true,
      maxStudents: -1,
      maxStaff: -1,
      storageGb: 100,
    },
  },

  COACHING_CENTER: {
    FREE: {
      studentManagement: true,
      teacherManagement: true,
      parentPortal: true,
      classManagement: false,
      batchManagement: true,
      subjectManagement: true,
      feeManagement: false,
      invoicing: true,
      paymentCollection: true,
      attendance: true,
      examResults: true,
      lessonPlanning: false,
      messaging: false,
      announcements: true,
      events: false,
      reports: false,
      auditLog: false,
      payroll: false,
      admissions: false,
      multiTeacher: true,
      onlineClassLinks: false,
      maxStudents: 30,
      maxStaff: 3,
      storageGb: 1,
    },
    STARTER: {
      studentManagement: true,
      teacherManagement: true,
      parentPortal: true,
      classManagement: false,
      batchManagement: true,
      subjectManagement: true,
      feeManagement: false,
      invoicing: true,
      paymentCollection: true,
      attendance: true,
      examResults: true,
      lessonPlanning: true,
      messaging: true,
      announcements: true,
      events: true,
      reports: true,
      auditLog: false,
      payroll: false,
      admissions: true,
      multiTeacher: true,
      onlineClassLinks: true,
      maxStudents: 150,
      maxStaff: 10,
      storageGb: 5,
    },
    PROFESSIONAL: {
      studentManagement: true,
      teacherManagement: true,
      parentPortal: true,
      classManagement: false,
      batchManagement: true,
      subjectManagement: true,
      feeManagement: true,
      invoicing: true,
      paymentCollection: true,
      attendance: true,
      examResults: true,
      lessonPlanning: true,
      messaging: true,
      announcements: true,
      events: true,
      reports: true,
      auditLog: true,
      payroll: true,
      admissions: true,
      multiTeacher: true,
      onlineClassLinks: true,
      maxStudents: 500,
      maxStaff: 50,
      storageGb: 20,
    },
    ENTERPRISE: {
      studentManagement: true,
      teacherManagement: true,
      parentPortal: true,
      classManagement: false,
      batchManagement: true,
      subjectManagement: true,
      feeManagement: true,
      invoicing: true,
      paymentCollection: true,
      attendance: true,
      examResults: true,
      lessonPlanning: true,
      messaging: true,
      announcements: true,
      events: true,
      reports: true,
      auditLog: true,
      payroll: true,
      admissions: true,
      multiTeacher: true,
      onlineClassLinks: true,
      maxStudents: -1,
      maxStaff: -1,
      storageGb: 100,
    },
  },

  PRIVATE_TUTOR: {
    FREE: {
      studentManagement: true,
      teacherManagement: false,
      parentPortal: false,
      classManagement: false,
      batchManagement: true,
      subjectManagement: false,
      feeManagement: false,
      invoicing: true,
      paymentCollection: true,
      attendance: true,
      examResults: true,
      lessonPlanning: false,
      messaging: false,
      announcements: false,
      events: false,
      reports: false,
      auditLog: false,
      payroll: false,
      admissions: false,
      multiTeacher: false,
      onlineClassLinks: false,
      maxStudents: 10,
      maxStaff: 0,
      storageGb: 0.5,
    },
    STARTER: {
      studentManagement: true,
      teacherManagement: false,
      parentPortal: false,
      classManagement: false,
      batchManagement: true,
      subjectManagement: false,
      feeManagement: false,
      invoicing: true,
      paymentCollection: true,
      attendance: true,
      examResults: true,
      lessonPlanning: true,
      messaging: true,
      announcements: false,
      events: false,
      reports: true,
      auditLog: false,
      payroll: false,
      admissions: false,
      multiTeacher: false,
      onlineClassLinks: true,
      maxStudents: 50,
      maxStaff: 0,
      storageGb: 2,
    },
    PROFESSIONAL: {
      studentManagement: true,
      teacherManagement: false,
      parentPortal: true,
      classManagement: false,
      batchManagement: true,
      subjectManagement: true,
      feeManagement: false,
      invoicing: true,
      paymentCollection: true,
      attendance: true,
      examResults: true,
      lessonPlanning: true,
      messaging: true,
      announcements: true,
      events: false,
      reports: true,
      auditLog: true,
      payroll: false,
      admissions: false,
      multiTeacher: false,
      onlineClassLinks: true,
      maxStudents: 200,
      maxStaff: 0,
      storageGb: 10,
    },
    ENTERPRISE: {
      studentManagement: true,
      teacherManagement: true,   // hiring assistants
      parentPortal: true,
      classManagement: false,
      batchManagement: true,
      subjectManagement: true,
      feeManagement: false,
      invoicing: true,
      paymentCollection: true,
      attendance: true,
      examResults: true,
      lessonPlanning: true,
      messaging: true,
      announcements: true,
      events: false,
      reports: true,
      auditLog: true,
      payroll: false,
      admissions: false,
      multiTeacher: true,
      onlineClassLinks: true,
      maxStudents: -1,
      maxStaff: 5,
      storageGb: 20,
    },
  },
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Returns the feature flags for a given tenant type and plan tier.
 * Falls back to FREE plan if plan is not found.
 */
export function getTenantFeatures(
  type: TenantType | string,
  plan: PlanTier | string,
): TenantFeatures {
  const tenantFeatures = FEATURES[type as TenantType]
  if (!tenantFeatures) return FEATURES.SCHOOL.FREE
  return tenantFeatures[plan as PlanTier] ?? tenantFeatures.FREE
}

/**
 * Check if a specific feature is enabled for a tenant type + plan combination.
 */
export function hasFeature(
  type: TenantType | string,
  plan: PlanTier | string,
  feature: keyof TenantFeatures,
): boolean {
  const features = getTenantFeatures(type, plan)
  const value = features[feature]
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value !== 0
  return false
}
