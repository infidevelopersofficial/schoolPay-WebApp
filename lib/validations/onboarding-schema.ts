import { z } from "zod";

const BLOCKED_SLUGS = [
  "admin", "api", "app", "dashboard", "support", "billing", 
  "settings", "root", "system", "www", "test"
];

export const onboardingSchema = z.object({
  slug: z.string()
    .min(3, "Workspace URL must be at least 3 characters")
    .max(50, "Workspace URL must not exceed 50 characters")
    .regex(/^[a-z0-9-]+$/, "Workspace URL can only contain lowercase letters, numbers, and hyphens")
    .refine((slug) => !BLOCKED_SLUGS.includes(slug), {
      message: "This Workspace URL is reserved and cannot be used"
    }),
  
  tenantType: z.enum(["SCHOOL", "COACHING_CENTER", "PRIVATE_TUTOR"], {
    errorMap: () => ({ message: "Invalid Tenant Type" })
  }),
  
  region: z.string().min(1, "Region is required"),
  language: z.string().min(1, "Language is required"),
  
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required (Required for GST/Compliance)"),
  city: z.string().optional(),
  
  timezone: z.string().min(1, "Timezone is required"),
  currency: z.string().min(1, "Currency is required"),

  // Conditional fields based on tenant type
  academicYear: z.string().optional(),
  classesCount: z.string().optional(),
  coursesCount: z.string().optional(),
  batchesCount: z.string().optional(),
  subjectsCount: z.string().optional(),
});

export type OnboardingFormData = z.infer<typeof onboardingSchema>;
