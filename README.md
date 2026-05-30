# SchoolPay — Multi-Tenant Education Fee Management

> Enterprise-grade, multi-tenant SaaS built for the Indian education market. One platform, three institution types — K-12 Schools, Coaching Centers, and Private Tutors — each with its own tailored workflows, terminology, and feature set.

---

## Table of Contents

- [Overview](#overview)
- [Key Concepts](#key-concepts)
- [Core Modules](#core-modules)
- [Architecture](#architecture)
- [Security Model](#security-model)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Local Development Notes](#local-development-notes)
- [Deployment (Vercel)](#deployment-vercel)
- [Operational Playbook](#operational-playbook)
- [Contributing](#contributing)

---

## Overview

SchoolPay handles the complete fee lifecycle for Indian educational institutions — from student enrollment and fee scheduling to GST-compliant invoicing and financial reporting. The platform adapts dynamically to three distinct institution types, each with its own data model, UI vocabulary, and feature availability.

**Supported institution types:**

| Type | Use Case | Key Features |
|---|---|---|
| `K12_SCHOOL` | Traditional schools | Classes, sections, term fee schedules, parent portal, attendance, exams & gradebook |
| `COACHING_CENTER` | Coaching institutes | Batches, test series, lead management, enrollment |
| `PRIVATE_TUTOR` | Independent educators | Individual learners, session tracking, invoicing |

---

## Key Concepts

### TenantType & Dynamic Adaptation

Every tenant in the system has a `TenantType` stored at registration. This single value drives three layers of adaptation:

1. **UI Terminology** — The same underlying concept renders differently per type. For example, a grouping of students is called a "Class" for K-12 schools, a "Batch" for coaching centers, and a "Group" for tutors. This mapping lives in `lib/tenant-config.ts`.

2. **Feature Flags** — Each `TenantType` has a capability set. Coaching centers get lead management; schools get the parent portal; tutors get simplified invoicing. Routes to disabled features are blocked at the Edge before rendering.

3. **Data Shape** — The Prisma schema uses a shared base with type-specific extension tables, so queries always operate on the correct data model for the active tenant.

### Tenant Isolation

All data access goes through a tenant context established at the start of each request. No query can touch another tenant's data — this is enforced at the PostgreSQL engine level via Row-Level Security, not just at the application layer. See [Security Model](#security-model) for details.

### Parent Portal

Parents and guardians authenticate through a dedicated, isolated interface at `/(parent-portal)/`. Authentication is handled via **OTP (One-Time Password) sent to a registered mobile number**, separate from the staff/admin session flow. Parents can only access their own child's fee history, outstanding dues, and payment receipts. The parent portal shares no session context with the admin dashboard.

---

## Core Modules

- **Student Management**: Enrollment, academic session linkage, and profile management.
- **Fee Structure & Collection**: Term-based fee schedules, Razorpay integration (with webhook fallbacks & security hardening), automated PDF receipt generation (`jsPDF`), and overdue tracking.
- **Exams & Gradebook**: Phase 6B implementation with explicit academic year linkage, dynamic grading scales, and report cards.
- **Attendance**: Phase 6A attendance tracking supporting daily registers, leave management, and reporting.
- **Parent Portal**: Dedicated OTP-authenticated mobile-first PWA for parents to view fees, download receipts, and check attendance/grades.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 15 (App Router)                  │
│                                                             │
│  ┌──────────────┐  ┌─────────────────┐  ┌───────────────┐  │
│  │   Edge       │  │  Server         │  │  Server       │  │
│  │   Middleware │  │  Components     │  │  Actions      │  │
│  │  (Route      │  │  (via DAL /     │  │  (withTenant  │  │
│  │   Guards)    │  │   withTenant    │  │   Auth RBAC)  │  │
│  │              │  │   Read)         │  │               │  │
│  └──────┬───────┘  └────────┬────────┘  └──────┬────────┘  │
│         │                   │                   │           │
└─────────┼───────────────────┼───────────────────┼───────────┘
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL (via Prisma ORM)                    │
│                                                             │
│   Native Row-Level Security policies enforce tenant         │
│   isolation at the database engine — not app layer          │
└─────────────────────────────────────────────────────────────┘
```

**Multi-tenant engine** — `lib/tenant-config.ts` exports a `getTenantConfig(tenantType)` function that returns the full capability set and UI terminology map for a given `TenantType`. Server Components and layouts consume this to render the correct interface without any client-side branching.

**Data Access Layer (DAL)** — All Server Component reads are wrapped in `withTenantRead(fn)` from `lib/dal/core.ts`. This uses `AsyncLocalStorage` to inject the current tenant context into every Prisma query, ensuring no cross-tenant data leakage even in deeply nested component trees.

**Server Action guards** — Every mutation goes through `withTenantAuth({ allowedRoles, requiredFeature })` from `lib/tenant-auth.ts`. This wrapper validates the session, checks RBAC roles, confirms the tenant has the required feature enabled, and initialises the RLS session variable before the action body runs.

---

## Security Model

SchoolPay is built on a defense-in-depth security model with four independent layers. A breach of any single layer does not expose tenant data.

### Layer 1 — PostgreSQL Native RLS

Every table has an RLS policy that evaluates `current_setting('app.current_tenant')` against the row's `schoolId` column. This is set unconditionally before any query executes. Even a SQL injection attack that bypasses the application layer cannot read another tenant's rows — the database engine filters them out.

RLS policies are defined in `prisma/migrations/` as raw SQL and are applied automatically on `prisma migrate deploy`.

> **Seeder note:** `prisma/seed.ts` connects via a superuser role that bypasses RLS (`BYPASSRLS` privilege), allowing it to insert seed data across tenants during initialisation. Application runtime connections never use this role.

### Layer 2 — Data Access Layer (DAL)

`withTenantRead` in `lib/dal/core.ts` wraps all Server Component data fetches. It:
- Reads the active tenant from `AsyncLocalStorage` context
- Calls `SET LOCAL app.current_tenant = '<id>'` at the start of every Prisma transaction
- Ensures the context is always present — missing context throws, it never silently falls through

### Layer 3 — Server Action RBAC

`withTenantAuth` in `lib/tenant-auth.ts` wraps all data mutations. It validates:
- An active, valid session (Auth.js JWT)
- The caller's role is in `allowedRoles`
- The tenant has the required feature flag enabled
- RLS session variable is initialised before the action body executes

### Layer 4 — Edge Middleware Route Guards

`middleware.ts` runs on the Vercel Edge Runtime and intercepts every request before any rendering occurs. It checks:
- Authentication status (valid JWT cookie)
- Feature flag availability for the requested route
- Tenant type compatibility

Unauthenticated or unauthorised requests are redirected at the network edge — no server compute is consumed and no page is rendered.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Database | PostgreSQL with Native Row-Level Security |
| ORM | Prisma with `$extends` transaction wrapper |
| Authentication | Auth.js (NextAuth v5) — JWT session strategy |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Charts | Recharts |
| Icons | Lucide React |
| Language | TypeScript |
| Utilities | `clsx`, `tailwind-merge` |
| Payments | Razorpay (Security Hardened Webhooks) |
| PDF Generation | jsPDF & pdf-lib |
| Rate Limiting | Upstash Redis |
| Observability | Sentry |
| Deployment | Vercel (Edge Runtime + Serverless Functions) |

> **Note on Tailwind CSS v4:** This project uses Tailwind v4, which introduces a CSS-first configuration model. There is no `tailwind.config.js` — configuration is defined directly in `globals.css` using `@theme`. If you are migrating from v3, refer to the [Tailwind v4 upgrade guide](https://tailwindcss.com/docs/upgrade-guide) before making style changes.

---

## Project Structure

```
├── app/
│   ├── (dashboard)/              # Admin & Teacher multi-tenant dashboard
│   │   ├── layout.tsx            # Tenant-aware shell (loads tenant config)
│   │   ├── students/
│   │   ├── fees/
│   │   ├── attendance/
│   │   └── settings/
│   ├── (parent-portal)/          # Isolated Parent/Guardian interface (OTP auth)
│   │   ├── layout.tsx
│   │   ├── login/
│   │   └── dashboard/
│   └── api/
│       ├── webhooks/             # Payment gateway webhooks (Razorpay)
│       └── cron/                 # Scheduled jobs (fee reminders, reports)
│
├── components/                   # Reusable UI widgets and layout components
│
├── lib/
│   ├── dal/
│   │   └── core.ts               # withTenantRead — AsyncLocalStorage DAL wrapper
│   ├── tenant-config.ts          # TenantType feature flags & UI terminology maps
│   ├── tenant-auth.ts            # withTenantAuth — Server Action RBAC + RLS init
│   ├── prisma.ts                 # Prisma client with $extends RLS transaction wrapper
│   └── auth.ts                   # Auth.js v5 configuration
│
├── prisma/
│   ├── schema.prisma             # Schema with Indian market financial extensions (GST)
│   ├── migrations/               # SQL migrations including Native RLS policy definitions
│   └── seed.ts                   # Database seeder (runs as BYPASSRLS superuser role)
│
└── middleware.ts                 # Edge Runtime route guards (auth + feature flags)
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (with RLS support — standard in all hosted providers)
- A Vercel account (for deployment) or any Node.js-compatible host

### 1. Environment Setup

```bash
cp .env.example .env
```

Open `.env` and configure:

```env
# Transaction Pooler — used by the application at runtime (PgBouncer compatible)
DATABASE_URL="postgres://user:pass@pooler.host.com:6543/db?pgbouncer=true"

# Direct Connection — used by Prisma for migrations (bypasses pooler)
DIRECT_URL="postgres://user:pass@direct.host.com:5432/db"

# Auth.js v5 secret — generate with: openssl rand -base64 33
AUTH_SECRET="your_generated_secret_here"
```

> `DATABASE_URL` points to your **transaction pooler** (e.g. Supabase's port 6543). `DIRECT_URL` is a **direct connection** to PostgreSQL (port 5432) and is required by Prisma Migrate to apply DDL statements and RLS policies. Do not swap them — migrations will silently fail.

### 2. Install Dependencies & Run Migrations

```bash
npm install

# Generate Prisma Client from schema
npx prisma generate

# Apply all migrations and Native RLS policies (requires DIRECT_URL)
npx prisma migrate deploy

# Seed the database with a default School tenant and Admin user
npm run db:seed
```

### 3. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Default seed credentials:**

| Field | Value |
|---|---|
| Email | `admin@school.com` |
| Password | `admin123` |

> ⚠️ **Change these immediately after first login.** Never deploy to a staging or production environment without rotating the seed credentials. The seed password is publicly known.

---

## Local Development Notes

### RLS with PgBouncer Locally

Running RLS locally with PgBouncer in transaction pooling mode requires that `app.current_tenant` is set inside every transaction (not just the connection), because PgBouncer reuses connections across requests and `SET` commands do not persist between transactions.

The Prisma `$extends` wrapper in `lib/prisma.ts` handles this by calling `SET LOCAL app.current_tenant` within each transaction. If you run Postgres directly (without PgBouncer) locally, this still works correctly — `SET LOCAL` scopes to the transaction regardless.

If you see "RLS policy violation" errors locally, check:
1. The `DIRECT_URL` connection does not go through PgBouncer
2. Your local Postgres user is **not** a superuser (superusers bypass RLS by default)
3. `withTenantRead` is wrapping your query — bare `prisma.` calls outside the DAL do not set the tenant context

### Prisma Studio & RLS

`npx prisma studio` connects via your `DATABASE_URL`. If that user has RLS applied, Studio will show filtered (or empty) tables. To inspect all data in Studio, temporarily use a direct superuser connection string. **Never commit a superuser connection string to `.env`.**

---

## Deployment (Vercel)

The project is optimised for Vercel's infrastructure.

### Build Configuration

`package.json` runs migrations automatically before the Next.js build:

```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

### Required Environment Variables

Add all three to your Vercel project settings under **Settings → Environment Variables**:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Transaction pooler URL (PgBouncer, port 6543) |
| `DIRECT_URL` | Direct Postgres URL (port 5432, for migrations) |
| `AUTH_SECRET` | Auth.js secret — generate with `openssl rand -base64 33` |

> `AUTH_URL` does **not** need to be set on Vercel — Auth.js v5 automatically infers it from `VERCEL_URL` on Vercel deployments.

---

## Operational Playbook

### Prisma Interactive Transactions

The Prisma client in `lib/prisma.ts` uses a `$extends` wrapper that manages Native RLS via sequential transactions. **Do not write manual interactive transactions** (`prisma.$transaction(async (tx) => {})`) unless you are explicitly bypassing the RLS wrappers and have a documented reason to do so.

If you need an interactive transaction, ensure you manually call:

```typescript
    await tx.$executeRaw`SELECT set_config('app.current_tenant', ${schoolId}, true)`;
```

as the first statement inside the transaction body, otherwise RLS will reject the queries.

### Webhooks & Cron Jobs

System-level operations (payment gateway webhooks, scheduled fee reminders, cron-triggered reports) run without a user session. Wrap these in `withSystemContext`:

```typescript
import { withSystemContext } from '@/lib/tenant-auth';

export async function POST(req: Request) {
  return withSystemContext(async () => {
    // RLS bypassed — cross-tenant or admin-level operations are safe here
    await processPaymentWebhook(req);
  });
}
```

`withSystemContext` executes a session-level `set_config('app.current_tenant', '', true)` which the RLS policy explicitly checks for as a bypass condition. Only use it in server-side, authenticated system contexts — never expose it to client-triggered code paths.

### Adding a New Feature Flag

1. Add the flag to the `TenantFeatures` type in `lib/tenant-config.ts`
2. Set its value for each `TenantType` in the `TENANT_CONFIGS` map
3. Add the guarded route pattern to `middleware.ts`
4. Wrap the Server Action with `withTenantAuth({ requiredFeature: 'yourFlag' })`

### GST & Financial Compliance

The Prisma schema includes Indian market financial extensions: HSN codes, GST rate slabs, and invoice serial number sequences. These are defined in `schema.prisma` and seeded with standard education-sector GST rates. Consult `prisma/seed.ts` for the default GST configuration before modifying rates.

---

## Contributing

1. Fork the repository and create a feature branch
2. Run `npm run db:seed` to ensure a clean local state
3. All Server Actions **must** use `withTenantAuth` — PRs without this will not be merged
4. All Server Component data fetches **must** use `withTenantRead` — bare `prisma.` calls in components are not permitted
5. Run `npx prisma validate` before submitting migrations
6. Test with a **non-superuser** Postgres role locally to catch RLS issues before they reach CI

---

*SchoolPay is part of an ongoing project. For architecture questions or deployment support, refer to the internal walkthroughs or open a discussion in the repository.*

superadmin@school.com   → SUPER_ADMIN (superadmin123)
admin@school.com        → ADMIN
student1@school.com     → STUDENT (student123)
student2@school.com     → STUDENT (student123)
student3@school.com     → STUDENT (student123)
teacher1@school.com     → TEACHER (teacher123)
teacher2@school.com     → TEACHER (teacher123)
parent1@school.com      → PARENT (parent123)
parent2@school.com      → PARENT (parent123)