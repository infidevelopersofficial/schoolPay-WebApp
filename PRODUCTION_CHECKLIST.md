# Production Readiness Checklist

> **Last updated**: July 2026

## ✅ Completed

- [x] Database schema applied (55+ models, 1784 lines)
- [x] Prisma 7 client initialized with `@prisma/adapter-pg`
- [x] Admin users seeded via `prisma/seed.ts`
- [x] Auth.js v5 configured with credentials provider (JWT strategy)
- [x] Edge middleware for route guards + feature flags
- [x] Local dev server starts successfully (`npm run dev`)
- [x] Native RLS policies applied on all tenant tables
- [x] Multi-tenant context (`lib/tenant-context.ts`, `lib/tenant-auth.ts`)
- [x] Docker compose for local PostgreSQL development
- [x] Razorpay payment gateway integration (orders + webhooks + verification)
- [x] SMS OTP via MSG91 for parent portal authentication
- [x] Cron jobs: fee reminders, attendance digests, recurring expenses
- [x] Financial reports with CSV + PDF export
- [x] Sentry error tracking configured (`sentry.client.config.ts`, `sentry.server.config.ts`)
- [x] Rate limiting via Upstash Redis
- [x] Billing & subscription model with Razorpay subscriptions
- [x] Parent Portal (OTP auth, fees, attendance, results)
- [x] Student Portal (dashboard, fees, results, profile)
- [x] Super Admin panel (tenant + user management)

## 🔧 Application Gaps (Pre-Production)

### Docs Pass (Pre-requisite)
- [x] Run full Docs Pass and cleanup (Immediate Active Step)

### CRITICAL — Edit/Update UI Missing (Phase 1)
- [ ] Build dedicated edit pages (`/[entity]/[id]/edit`) for: Students, Teachers, Parents, Classes, Subjects, Lessons, Events, Messages, Announcements
- [ ] Wire `updateStudent()`, `updateTeacher()`, etc. DAL functions to UI
- [ ] Add "Edit" action buttons to all data tables

### CRITICAL — View/Detail Pages Missing (Phase 2)
- [ ] Teachers detail page (`/teachers/[id]`)
- [ ] Parents detail page (`/parents/[id]`)
- [ ] Classes detail page (`/classes/[id]`)
- [ ] Fees detail page (`/fees/[id]`)
- [ ] Payments detail page (`/payments/[id]`)

### HIGH — Delete Actions Missing (Phase 3)
- [ ] Soft-Delete (`isActive = false`) for: Subjects, Lessons, Events, Messages, Announcements, Fees, Payments
- [ ] Replace `window.confirm()` with proper AlertDialog component

### HIGH — Import/Export Missing
- [ ] Export (CSV/PDF) buttons on all data tables (Students, Teachers, Parents, etc.)
- [ ] Bulk import for Teachers (CSV)
- [ ] Bulk import for Parents (CSV)

---

## 🔧 Infrastructure TODO

### 1. Database: Production Setup (CRITICAL)
- [ ] Provision production PostgreSQL (Neon / Supabase / AWS RDS)
- [ ] Obtain pooler + direct connection strings
- [ ] Test migration: `npx prisma migrate deploy`
- [ ] Verify RLS policies are active on production

### 2. Environment Variables (CRITICAL)
- [ ] All variables set in Vercel dashboard:
  - `DATABASE_URL` (pooler connection)
  - `DIRECT_URL` (direct connection for migrations)
  - `AUTH_SECRET` (rotated from development value)
  - `MSG91_API_KEY` + `MSG91_TEMPLATE_ID`
  - `CRON_SECRET`
  - `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET`
  - `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_AUTH_TOKEN`
- [ ] Verify `.env.production` is NOT in git

### 3. Build & Deployment (CRITICAL)
- [ ] Clean production build passes: `npm run build`
- [ ] Set up CI/CD pipeline (GitHub Actions → Vercel)
- [ ] Add `prisma migrate deploy` to CI pipeline before build
- [ ] Configure preview deployments for PRs

### 4. Security (HIGH)
- [ ] Rotate AUTH_SECRET from development value
- [ ] Audit CORS settings
- [ ] Verify credentials are NOT in logs (check logger config)
- [ ] Security headers configured in `next.config.mjs`
- [ ] Test cross-tenant isolation with two schools

### 5. Performance & Monitoring (MEDIUM)
- [ ] Configure database connection pooling limits
- [ ] Set up Sentry alerting rules
- [ ] Review slow query logging thresholds
- [ ] Test under load (k6 or similar)

### 6. Testing (MEDIUM)
- [ ] End-to-end login test with production DB
- [ ] Test all 14+ modules for CRUD operations
- [ ] Test multi-tenant isolation
- [ ] Browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness

---

## Risk Summary

- ⚠️ **Edit forms don't exist** — users cannot update any record after creation
- ⚠️ **AUTH_SECRET may be demo value** — MUST rotate before production
- ⚠️ **No load testing performed** — unknown behavior under concurrent users
- ⚠️ **No disaster recovery tested** — backup/restore procedure undocumented

---

*Last updated: July 2026*
