# 🚀 SchoolPay — Quick Start Guide

> Get your local development environment running in under 5 minutes.

---

## Prerequisites

- **Node.js 20+** installed
- **PostgreSQL 15+** running (via Docker or a hosted service like Supabase/Neon)
- **Git** for cloning the repo

---

## Step 1: Clone & Install

```bash
git clone <repo-url>
cd schoolPay-WebApp
npm install
```

## Step 2: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL connection strings:
```env
DATABASE_URL="postgres://user:pass@localhost:6543/schoolpay?pgbouncer=true"
DIRECT_URL="postgres://user:pass@localhost:5432/schoolpay"
AUTH_SECRET="generate-with-openssl-rand-base64-33"
```

## Step 3: Database Setup

**Option A — Docker (recommended for local dev):**
```bash
npm run db:start     # Starts PostgreSQL via docker-compose
npm run db:deploy    # Applies all migrations + RLS policies
npm run db:seed      # Seeds default school + admin user
```

**Option B — Hosted PostgreSQL (Supabase / Neon):**
```bash
npx prisma migrate deploy   # Apply migrations
npm run db:seed              # Seed data
```

## Step 4: Start Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → Login with the seeded admin credentials from `prisma/seed.ts`.

---

## 🎯 Try These Features

### 1. Add a Student (30 seconds)
1. Click **"Students"** in sidebar
2. Click **"Add New Student"** button
3. Fill in name, email, class → Click **"Add Student"**
4. ✅ Student appears in the table

### 2. Record a Payment (30 seconds)
1. Click **"Payments"** in sidebar
2. Click **"Record Payment"** button
3. Search and select a student → enter amount → select method
4. Click **"Record Payment"**
5. ✅ Payment recorded, student fee status updates

### 3. Set Up Fee Structure (1 minute)
1. Click **"Fees"** in sidebar → **"Create Fee Structure"**
2. Follow the wizard: name → add fee items → map to classes
3. Click **"Generate Invoices"**
4. ✅ Invoices created for all students in mapped classes

### 4. Generate a Report (30 seconds)
1. Click **"Reports"** in sidebar
2. Select report type (Fee Collection / Outstanding / Attendance)
3. Set date range → Click **CSV** or **PDF**
4. ✅ Report downloads to your computer

### 5. Mark Attendance (30 seconds)
1. Click **"Attendance"** in sidebar
2. Select a batch/class and date
3. Mark each student Present/Absent/Late
4. Click **"Submit"**

---

## 📱 Available Modules

### Management
- ✅ **Students** — Add, view details, import CSV, delete
- ✅ **Teachers** — Add, assign subjects/classes, delete
- ✅ **Parents** — Add, link to students, delete
- ✅ **Classes** — Create with sections, manage capacity
- ✅ **Subjects** — Subject registry with codes

### Academic
- ✅ **Lessons** — Create lesson plans
- ✅ **Exams** — Schedule with exam groups + grading schemes
- ✅ **Results** — Bulk entry with auto-grading + report cards (PDF)
- ✅ **Attendance** — Bulk marking, register locking, statistics

### Financial
- ✅ **Fees** — Multi-step fee wizard, class mapping, invoice generation
- ✅ **Payments** — Record with receipt numbers, multiple payment methods
- ✅ **Expenses** — Category-based tracking, recurring expenses
- ✅ **Reports** — Fee collection, outstanding fees, daily settlement, attendance (CSV + PDF)

### Communication
- ✅ **Events** — Create school events
- ✅ **Messages** — Internal messaging
- ✅ **Announcements** — School-wide announcements
- ✅ **Campaigns** — Audience-targeted communication builder
- ✅ **Surveys** — Create, publish, collect responses with analytics

### Portals
- ✅ **Parent Portal** — OTP-based login, view child's fees/attendance/results
- ✅ **Student Portal** — View own dashboard, fees, results, attendance

---

## 🔧 Useful Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run db:start` | Start Docker PostgreSQL |
| `npm run db:stop` | Stop Docker PostgreSQL |
| `npm run db:deploy` | Apply database migrations |
| `npm run db:seed` | Seed default data |
| `npm run db:studio` | Open Prisma Studio (DB GUI) |
| `npm run db:reset` | ⚠️ Reset database (destroys data) |
| `npx prisma migrate dev --name <name>` | Create new migration |

---

## 🐛 Troubleshooting

**"Can't reach database server"**
→ Ensure PostgreSQL is running: `npm run db:start` or check your hosted DB status.

**"RLS policy violation"**
→ Your DB user might be a superuser (bypasses RLS). Use a non-superuser role. See README.md for details.

**"Invalid data provided" on forms**
→ Delete `.next` folder and restart: `rm -rf .next && npm run dev`

**Build failing with TypeScript errors**
→ Run `npx prisma generate` first to ensure the Prisma client is up-to-date.

---

## 📚 Further Reading

- [README.md](./README.md) — Full architecture & security model
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) — Deployment checklist
- [crud-matrix.md](./crud-matrix.md) — Feature completion status per module

---

*Last updated: July 2026*
