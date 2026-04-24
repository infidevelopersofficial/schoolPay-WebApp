export type TenantType = "SCHOOL" | "COACHING_CENTER" | "PRIVATE_TUTOR"

export interface TenantConfig {
  hasClasses: boolean
  hasBatches: boolean
  hasAttendance: boolean
  hasTransportation: boolean
  hasExams: boolean
  billingMode: "FEE" | "INVOICE"
  terminology: {
    dashboard: string
    students: string
    teachers: string
    classesOrBatches: string
    admissions: string
  }
}

export const defaultTenantConfig: TenantConfig = {
  hasClasses: true,
  hasBatches: false,
  hasAttendance: true,
  hasTransportation: true,
  hasExams: true,
  billingMode: "FEE",
  terminology: {
    dashboard: "School Dashboard",
    students: "Students",
    teachers: "Teachers",
    classesOrBatches: "Classes",
    admissions: "Admissions",
  },
}

export function resolveTenantConfig(
  type: TenantType | string = "SCHOOL",
  dbSettings: Partial<TenantConfig> = {}
): TenantConfig {
  let baseConfig = { ...defaultTenantConfig }

  switch (type) {
    case "COACHING_CENTER":
      baseConfig = {
        hasClasses: false,
        hasBatches: true,
        hasAttendance: true,
        hasTransportation: false,
        hasExams: true,
        billingMode: "INVOICE",
        terminology: {
          dashboard: "Coaching Dashboard",
          students: "Students",
          teachers: "Faculty",
          classesOrBatches: "Batches",
          admissions: "Registrations",
        },
      }
      break

    case "PRIVATE_TUTOR":
      baseConfig = {
        hasClasses: false,
        hasBatches: true,
        hasAttendance: true,
        hasTransportation: false,
        hasExams: false,
        billingMode: "INVOICE",
        terminology: {
          dashboard: "Tutor Dashboard",
          students: "Learners",
          teachers: "Tutors",
          classesOrBatches: "Sessions",
          admissions: "Registrations",
        },
      }
      break

    case "SCHOOL":
    default:
      baseConfig = { ...defaultTenantConfig }
      break
  }

  // Deep merge dbSettings into baseConfig
  return {
    ...baseConfig,
    ...dbSettings,
    terminology: {
      ...baseConfig.terminology,
      ...(dbSettings.terminology || {}),
    },
  }
}
