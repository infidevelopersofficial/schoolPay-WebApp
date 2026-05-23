const fs = require('fs');

let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Replace PlanTier enum usage in School
schema = schema.replace(
  '  plan                  PlanTier   @default(FREE)',
  `  planId                  String?
  plan                    Plan?              @relation(fields: [planId], references: [id])
  subscriptionStatus      SubscriptionStatus @default(TRIALING)
  currentPeriodEnd        DateTime?`
);

// Add relations to the bottom of the School model
schema = schema.replace(
  '  activityLogs    ActivityLog[]\n\n  @@index([slug])',
  `  activityLogs    ActivityLog[]
  subscription            Subscription?
  usageRecord             UsageRecord?
  paymentTransactions     PaymentTransaction[]
  tenantMetrics           TenantMetrics[]

  @@index([slug])`
);
// In case the newline characters are \r\n
schema = schema.replace(
  '  activityLogs    ActivityLog[]\r\n\r\n  @@index([slug])',
  `  activityLogs    ActivityLog[]\r\n  subscription            Subscription?\r\n  usageRecord             UsageRecord?\r\n  paymentTransactions     PaymentTransaction[]\r\n  tenantMetrics           TenantMetrics[]\r\n\r\n  @@index([slug])`
);

// Delete the PlanTier enum block entirely
schema = schema.replace(/enum PlanTier\s*\{\s*FREE\s*STARTER\s*PROFESSIONAL\s*ENTERPRISE\s*\}/, '');

const newModels = `
// ============================================
// SaaS Billing & Subscription (Phase 5B.3)
// ============================================

model Plan {
  id                 String         @id @default(cuid())
  name               String         @unique // FREE, STARTER, GROWTH, ENTERPRISE
  description        String?
  monthlyPrice       Int            @default(0) // Stored in smallest currency unit (paise)
  yearlyPrice        Int            @default(0)
  currency           String         @default("INR")
  
  // Operational Limits
  studentLimit       Int            @default(50)
  staffLimit         Int            @default(5)
  storageLimitGb     Int            @default(1)
  
  // Feature Gates (Explicit)
  studentPortal      Boolean        @default(false)
  parentPortal       Boolean        @default(false)
  lms                Boolean        @default(false)
  customDomain       Boolean        @default(false)
  apiAccess          Boolean        @default(false)
  whiteLabel         Boolean        @default(false)
  
  schools            School[]
  subscriptions      Subscription[]
  createdAt          DateTime       @default(now())
  updatedAt          DateTime       @updatedAt
}

model Subscription {
  id                     String             @id @default(cuid())
  schoolId               String             @unique
  school                 School             @relation(fields: [schoolId], references: [id])
  planId                 String
  plan                   Plan               @relation(fields: [planId], references: [id])
  
  // Normalized Billing State
  status                 SubscriptionStatus @default(TRIALING)
  billingCycle           BillingCycle       @default(NONE)
  currentPeriodStart     DateTime
  currentPeriodEnd       DateTime
  graceEndsAt            DateTime?
  cancelAtPeriodEnd      Boolean            @default(false)
  
  // Provider Fields
  providerName           String             @default("RAZORPAY")
  providerSubscriptionId String?            @unique
  providerCustomerId     String?
  
  billingEvents          BillingEvent[]
  createdAt              DateTime           @default(now())
  updatedAt              DateTime           @updatedAt

  @@index([status])
}

enum SubscriptionStatus {
  TRIALING
  ACTIVE
  GRACE_PERIOD
  PAST_DUE
  CANCELED
  EXPIRED
}

enum BillingCycle {
  MONTHLY
  YEARLY
  NONE
}

model PaymentTransaction {
  id                     String         @id @default(cuid())
  schoolId               String
  school                 School         @relation(fields: [schoolId], references: [id])
  
  provider               String         @default("RAZORPAY")
  razorpayPaymentId      String?        @unique
  razorpayOrderId        String?        @unique
  razorpaySubscriptionId String?
  
  amount                 Decimal
  currency               String         @default("INR")
  status                 PaymentStatus  @default(PENDING)
  
  failureReason          String?
  invoiceReference       String?

  paidAt                 DateTime?
  createdAt              DateTime       @default(now())
  
  @@index([schoolId])
}

model BillingWebhookEvent {
  id              String   @id @default(cuid())
  providerEventId String   @unique
  eventType       String
  isProcessed     Boolean  @default(false)
  processingError String?
  rawPayload      Json?
  processedAt     DateTime @default(now())
  
  @@index([providerEventId])
}

model UsageRecord {
  id               String   @id @default(cuid())
  schoolId         String   @unique
  school           School   @relation(fields: [schoolId], references: [id])
  currentStudents  Int      @default(0)
  currentStaff     Int      @default(0)
  currentStorageGb Int      @default(0)
  lastCalculatedAt DateTime @default(now())
}

model TenantMetrics {
  id               String   @id @default(cuid())
  schoolId         String
  school           School   @relation(fields: [schoolId], references: [id])
  date             DateTime // Daily snapshot date
  mrr              Int      @default(0)
  arr              Int      @default(0)
  activeStudents   Int      @default(0)
  activeStaff      Int      @default(0)
  
  @@unique([schoolId, date])
}

model BillingEvent {
  id             String        @id @default(cuid())
  subscriptionId String
  subscription   Subscription  @relation(fields: [subscriptionId], references: [id])
  schoolId       String
  action         String        // "PAYMENT_FAILED", "LIMIT_EXCEEDED"
  amount         Int?
  description    String?
  createdAt      DateTime      @default(now())
  
  @@index([schoolId])
}
`;

fs.writeFileSync('prisma/schema.prisma', schema + "\n" + newModels);
console.log("Updated schema successfully.");
