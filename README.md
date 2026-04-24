# SchoolPay - Multi-Tenant Education SaaS

A comprehensive, enterprise-grade multi-tenant education management system built for the Indian market. Designed to dynamically support **Schools**, **Coaching Centers**, and **Private Tutors**, the platform features a complete dashboard for managing students, teachers, fees, attendance, and financial compliance (GST).

Built with maximum security in mind, the architecture relies on **Native PostgreSQL Row-Level Security (RLS)** to enforce strict data isolation between tenants, paired with Edge Middleware for dynamic route guarding.

## Architecture Highlights

- **Multi-Tenant Engine**: Dynamically adapts UI, terminology, and feature availability based on the active `TenantType` (e.g., "Classes" vs. "Batches").
- **Enterprise Security**: Native PostgreSQL Row-Level Security (RLS) handles cross-tenant data isolation directly at the database engine level.
- **Edge Route Guards**: Next.js Edge Middleware intercepts unauthorized accesses to feature-flagged routes before rendering.
- **Data Access Layer (DAL)**: All Server Component read operations are wrapped in an AsyncLocalStorage context (`withTenantRead`) to ensure Prisma queries never leak data.
- **Role-Based Access Control (RBAC)**: Server Actions are strictly gated by `allowedRoles` arrays and tenant feature flags (`withTenantAuth`).

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL (via Prisma ORM) with Native RLS
- **Authentication**: Auth.js (NextAuth v5 Beta) with JWT Session Strategy
- **Styling**: Tailwind CSS v4 & shadcn/ui
- **Charts**: Recharts
- **Icons**: Lucide React
- **Utilities**: TypeScript, clsx, tailwind-merge

## Project Structure

```
├── app/
│   ├── (dashboard)/            # Admin/Teacher multi-tenant dashboard
│   ├── (parent-portal)/        # Dedicated Parent/Guardian interface
│   └── api/                    # API routes and Webhooks
├── components/                 # Reusable UI widgets and layout components
├── lib/
│   ├── dal/                    # Data Access Layer wrappers (core.ts, etc.)
│   ├── prisma.ts               # Prisma client with $extends transaction wrapper
│   ├── tenant-config.ts        # Universal multi-tenant feature flags
│   ├── tenant-auth.ts          # Server Action wrappers (RBAC & RLS init)
│   └── auth.ts                 # NextAuth v5 Configuration
├── prisma/
│   ├── schema.prisma           # Prisma Schema with Indian market financial extensions
│   ├── migrations/             # SQL Migrations including Native RLS policies
│   └── seed.ts                 # Database seeder (RLS bypassed for init)
└── middleware.ts               # Edge Runtime route guards
```

## Getting Started

### 1. Environment Setup

Copy `.env.example` to `.env` and configure your database and authentication secrets.

```env
# Transaction Pooler (Used by App runtime)
DATABASE_URL="postgres://user:pass@pooler.host.com:6543/db?pgbouncer=true"

# Direct Connection (Used by Prisma for migrations)
DIRECT_URL="postgres://user:pass@direct.host.com:5432/db"

# NextAuth v5 Secret
AUTH_SECRET="your_generated_secret_here"
```

*Note: You can generate a secure `AUTH_SECRET` by running `openssl rand -base64 33` in your terminal.*

### 2. Installation & Database Migration

Install dependencies and synchronize the Prisma schema with your PostgreSQL database:

```bash
npm install

# Generate Prisma Client
npx prisma generate

# Apply Migrations & Native RLS policies (Requires DIRECT_URL)
npx prisma migrate deploy

# Seed the default School and Admin user
npm run db:seed
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
**Default Login**: `admin@school.com` / `admin123`

## Deployment (Vercel)

The application is heavily optimized for Vercel deployment. 

Your `package.json` build script automatically runs migrations before compiling Next.js:
`"build": "prisma generate && prisma migrate deploy && next build"`

Ensure that you add `DATABASE_URL`, `DIRECT_URL`, and `AUTH_SECRET` to your Vercel Environment Variables. The Next.js Edge Runtime will automatically detect `AUTH_URL` based on the Vercel deployment URL.

## Operational Playbook

### Interactive Prisma Transactions
Because of the Prisma Client Extension that manages Native RLS via sequential transactions, developers should **avoid** writing manual interactive transactions (`prisma.$transaction(async (tx) => {})`) unless explicitly bypassing the RLS wrappers. 

### Webhooks & Cron Jobs
System-level operations that lack a user session must be wrapped in `withSystemContext(() => {...})`. This executes a session-level Postgres `set_config` that bypasses the Native RLS policy to allow cross-tenant or admin-level data mutations.

## License

This project is part of the SchoolPay School Fees Management System.

## Support

For issues or questions regarding multi-tenant scaling or deployment, please refer to the internal architectural walkthroughs or contact support.
