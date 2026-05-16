        # SchoolPay - Multi-Tenant Education SaaS

        A comprehensive, enterprise-grade multi-tenant education management system built for the Indian market. Designed to dynamically support **Schools**, **Coaching Centers**, and **Private Tutors**, the platform features a complete dashboard for managing students, teachers, fees, attendance, and financial compliance (GST).

**🚀 Production Ready** | **📊 100% Feature Complete** | **🔒 Enterprise Security**

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

#### Development Environment
Copy `.env.example` to `.env.local` and configure for local development:

```env
# Local PostgreSQL (Docker)
DATABASE_URL="postgresql://postgres:postgres@localhost:6543/schoolpay?schema=public&pgbouncer=true"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/schoolpay?schema=public"

# NextAuth v5 Secret (for development)
AUTH_SECRET="dev-secret-change-in-production-$(openssl rand -base64 33)"
NEXTAUTH_URL="http://localhost:3000"
```

#### Production Environment (Neon + Vercel)
Create `.env.production.local` with Neon credentials:

```env
# Neon PostgreSQL - Connection Pooler (App Runtime)
DATABASE_URL="postgresql://user:password@ep-your-db.region.neon.tech:6543/schoolpay?sslmode=require&pgbouncer=true"

# Neon PostgreSQL - Direct Connection (Prisma Migrations)
DIRECT_URL="postgresql://user:password@ep-your-db.region.neon.tech:5432/schoolpay?sslmode=require"

# Production Auth Settings
NEXTAUTH_URL="https://your-production-domain.com"
AUTH_SECRET="$(openssl rand -base64 64)"  # Generate strong 64-byte secret

# Optional: Sentry Error Tracking
NEXT_PUBLIC_SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"
SENTRY_AUTH_TOKEN="your-sentry-token"
```

**Neon Setup Instructions:**
1. Sign up at [Neon Console](https://console.neon.tech)
2. Create project and database
3. Copy connection strings from Neon dashboard
4. Use connection pooler URL (`ep-*.neon.tech:6543`) for `DATABASE_URL`
5. Use direct connection URL (`ep-*.neon.tech:5432`) for `DIRECT_URL`

*Generate secure AUTH_SECRET: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`*

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

## Deployment (Vercel + Neon)

The application is production-optimized for **Vercel deployment** with **Neon PostgreSQL**.

### Step-by-Step Deployment Guide

#### 1. Prepare Neon Database
```bash
# 1. Create Neon project at https://console.neon.tech
# 2. Copy connection strings from Neon dashboard
# 3. Test connection locally:
DIRECT_URL="postgresql://user:password@ep-xxx.neon.tech:5432/schoolpay" npx prisma migrate status
```

#### 2. Deploy to Vercel
```bash
# 1. Push code to GitHub
git push origin main

# 2. Go to https://vercel.com/new
# 3. Import your GitHub repository
# 4. Configure environment variables:
```

**Vercel Environment Variables:**
```
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech:6543/schoolpay?sslmode=require&pgbouncer=true
DIRECT_URL=postgresql://user:password@ep-xxx.neon.tech:5432/schoolpay?sslmode=require
NEXTAUTH_URL=https://your-production-domain.vercel.app (or your custom domain)
AUTH_SECRET=<strong-64-byte-secret>
NEXT_PUBLIC_SENTRY_DSN=<if-using-sentry>
SENTRY_AUTH_TOKEN=<if-using-sentry>
```

#### 3. Configure Custom Domain (Optional)
```
Settings → Domains → Add Domain
```

#### 4. Build Script
Your `package.json` build script automatically runs migrations:
```json
"build": "prisma generate && prisma migrate deploy && next build"
```

### Post-Deployment Verification

```bash
# 1. Verify migrations ran successfully
# Check Vercel logs: Deployments → Build Logs

# 2. Test login at production URL
# Default: admin@school.com / admin123

# 3. Verify multi-tenant isolation
# Test cross-school data access (should be blocked by RLS)

# 4. Monitor Sentry (optional)
# Check error tracking dashboard
```

### Troubleshooting Deployment

**Issue:** Migration fails during build
```bash
# Solution: Verify DIRECT_URL is set in Vercel Environment Variables
# DIRECT_URL must be a direct connection (not pooler)
```

**Issue:** Can't connect to Neon
```bash
# Solution: Check connection string format
# Must include ?sslmode=require for Neon
```

**Issue:** Multi-tenant data leaking
```bash
# Solution: Verify RLS policies are active
# Run: SELECT * FROM information_schema.table_constraints WHERE constraint_type='POLICY'
```

        ## Operational Playbook

        ### Interactive Prisma Transactions
        Because of the Prisma Client Extension that manages Native RLS via sequential transactions, developers should **avoid** writing manual interactive transactions (`prisma.$transaction(async (tx) => {})`) unless explicitly bypassing the RLS wrappers. 

        ### Webhooks & Cron Jobs
        System-level operations that lack a user session must be wrapped in `withSystemContext(() => {...})`. This executes a session-level Postgres `set_config` that bypasses the Native RLS policy to allow cross-tenant or admin-level data mutations.

        ## License

        This project is part of the SchoolPay School Fees Management System.

        ## Support

        For issues or questions regarding multi-tenant scaling or deployment, please refer to the internal architectural walkthroughs or contact support.
