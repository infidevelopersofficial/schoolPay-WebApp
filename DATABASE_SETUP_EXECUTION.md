## PostgreSQL + Prisma Setup - Execution Checklist

### ✅ Step 1: Start PostgreSQL Container
**Command:**
```bash
cd /home/somesh/Codework/SchoolPay/school-fees-management
docker-compose up -d
```

**Verify Success:**
```bash
# Check if container is running
docker ps | grep schoolpay-postgres
# Expected: Container "schoolpay-postgres" in RUNNING state

# Check health status
docker-compose ps
# Expected: "schoolpay-postgres" showing "healthy" or "Up X seconds"

# View logs to confirm ready
docker logs schoolpay-postgres
# Expected: "database system is ready to accept connections"
```

**What's happening:**
- Docker pulls postgres:16-alpine image
- Creates container with name "schoolpay-postgres"
- Maps port 5432 (PostgreSQL) → 6543 (host)
- Creates volume "postgres_data" for persistent storage
- Creates database "schoolpay" with user "postgres"
- Initializes with UTF-8 encoding

**Time estimate:** 30-60 seconds

---

### ✅ Step 2: Verify Database Connectivity
**Command:**
```bash
# Test connection via psql (if installed locally)
psql postgresql://postgres:postgres@localhost:6543/schoolpay -c "SELECT 1"
# Expected: Output "1"

# Alternative: Use docker exec
docker exec schoolpay-postgres psql -U postgres -d schoolpay -c "SELECT 1"
# Expected: Output "1"
```

**Troubleshooting:**
```bash
# If connection fails, check container logs
docker logs schoolpay-postgres

# If port is in use
lsof -i :6543
# Kill if needed: lsof -ti :6543 | xargs kill -9

# Check environment inside container
docker exec schoolpay-postgres env | grep POSTGRES
```

---

### ✅ Step 3: Verify Prisma Client
**Command:**
```bash
cd /home/somesh/Codework/SchoolPay/school-fees-management

# Check if Prisma Client is already generated
ls -la node_modules/.prisma/client/
# Expected: Index.ts and other generated files exist
```

**If NOT generated, run:**
```bash
npx prisma generate
# Expected: "✔ Generated Prisma Client to ./node_modules/.prisma/client in XXms"
```

**Status:** ✅ Prisma Client already exists in your project

---

### ✅ Step 4: Run Prisma Migrations
**Command:**
```bash
# Apply all pending migrations to the database
npx prisma migrate deploy
# Expected: "All migrations have been successfully applied"

# If no migrations exist (fresh schema), use:
npx prisma db push
# Expected: "Database has been successfully created with this schema"
```

**Verify schema was created:**
```bash
docker exec schoolpay-postgres psql -U postgres -d schoolpay -c "\dt"
# Expected: List of tables (School, User, Student, Teacher, Parent, etc.)

docker exec schoolpay-postgres psql -U postgres -d schoolpay -c "\d School"
# Expected: Columns: id, name, address, phone, email, website, createdAt, updatedAt
```

---

### ✅ Step 5: Test Prisma Connection from App
**Create a test route (temporary):**

File: `app/api/db-test/route.ts`
```typescript
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const schools = await prisma.school.findMany({ take: 1 })
    return Response.json({
      status: 'connected',
      message: 'Database connection successful',
      schemaVerified: true,
      schoolCount: schools.length,
    })
  } catch (error: any) {
    return Response.json(
      {
        status: 'error',
        message: error.message,
        code: error.code,
      },
      { status: 500 }
    )
  }
}
```

**Test it:**
```bash
# Make sure app is running
npm run dev
# In another terminal:
curl http://localhost:3000/api/db-test

# Expected response:
# {
#   "status": "connected",
#   "message": "Database connection successful",
#   "schemaVerified": true,
#   "schoolCount": 0
# }
```

---

### ✅ Step 6: Verify Multi-Tenant Prisma Setup
**Status:** ✅ **DO NOT TOUCH** your existing `lib/tenant-prisma.ts`

**Confirmation:**
- Your multi-tenant implementation (getTenantPrisma, withTenant) is **logically correct**
- It works with the **clean lib/prisma.ts** you have now
- All tenant scoping is handled AFTER database connection
- No changes needed to tenantPrisma logic

**Test multi-tenant query (optional):**
```typescript
// In an API route with middleware
const school1Prisma = getTenantPrisma('school-1-id')
const students = await school1Prisma.student.findMany()
// Expected: Only students for school-1, not other schools
```

---

### 📋 Complete Command Sequence (Copy-Paste Ready)

Run these commands in order:

```bash
# 1. Navigate to project
cd /home/somesh/Codework/SchoolPay/school-fees-management

# 2. Start PostgreSQL
docker-compose up -d

# 3. Wait for container to be healthy (watch this)
watch docker-compose ps

# 4. Once "schoolpay-postgres" shows healthy, Ctrl+C and continue

# 5. Generate Prisma Client (if not already)
npx prisma generate

# 6. Push schema to database
npx prisma db push
# or: npx prisma migrate deploy

# 7. Verify schema was created
docker exec schoolpay-postgres psql -U postgres -d schoolpay -c "\dt"

# 8. Start dev server
npm run dev

# 9. Test database connection
curl http://localhost:3000/api/db-test

# 10. Done! All Prisma queries should now work
```

---

### ✅ Verification Checklist

Run through this to confirm everything works:

**Docker & PostgreSQL:**
- [ ] `docker ps` shows "schoolpay-postgres" in RUNNING state
- [ ] `docker-compose ps` shows container health as "healthy"
- [ ] `docker logs schoolpay-postgres` shows "ready to accept connections"
- [ ] `psql postgresql://postgres:postgres@localhost:6543/schoolpay -c "SELECT 1"` returns 1

**Prisma:**
- [ ] `ls node_modules/.prisma/client/index.d.ts` exists
- [ ] `npx prisma db push` succeeds (or "already up to date")
- [ ] `npx prisma studio` opens UI showing tables

**Application:**
- [ ] `npm run dev` starts without errors
- [ ] `curl http://localhost:3000/api/db-test` returns `{"status": "connected", ...}`
- [ ] No "Can't reach database server" errors
- [ ] Multi-tenant queries work (getTenantPrisma returns results)

**Database Schema:**
- [ ] School table exists: `docker exec schoolpay-postgres psql -U postgres -d schoolpay -c "\d School"`
- [ ] All tables created: `docker exec schoolpay-postgres psql -U postgres -d schoolpay -c "\dt"`
- [ ] Constraints applied correctly

---

### 🔧 Useful Commands for Development

```bash
# View database with Prisma Studio (GUI)
npx prisma studio

# Reset database (CAUTION: deletes all data)
npx prisma migrate reset
# or
docker exec schoolpay-postgres psql -U postgres -d schoolpay -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
npx prisma db push

# View all migrations
npx prisma migrate status

# Create a new migration (if schema.prisma changes)
npx prisma migrate dev --name your_migration_name

# Check Prisma logs
npx prisma debug --query

# Stop Docker container
docker-compose down

# Stop and remove volumes (WARNING: deletes database)
docker-compose down -v

# View container logs
docker logs -f schoolpay-postgres

# Backup database
docker exec schoolpay-postgres pg_dump -U postgres schoolpay > backup.sql

# Restore database
docker exec -i schoolpay-postgres psql -U postgres schoolpay < backup.sql
```

---

### 🚨 Troubleshooting

**Issue: "Can't reach database server at localhost:6543"**
```bash
# 1. Check if Docker is running
docker info

# 2. Check if container exists and is running
docker ps -a | grep schoolpay

# 3. If not running:
docker-compose up -d

# 4. Check container logs for errors
docker logs schoolpay-postgres

# 5. Verify DATABASE_URL in .env
cat .env | grep DATABASE_URL
# Should be: postgresql://postgres:postgres@localhost:6543/schoolpay?schema=public
```

**Issue: "Port 6543 already in use"**
```bash
# Find what's using the port
lsof -i :6543

# Kill the process
kill -9 <PID>

# Or change docker-compose.yml port mapping from 6543:5432 to 6544:5432
```

**Issue: "psql: error: connection to server at localhost (127.0.0.1), port 6543 failed"**
```bash
# Wait for container to be healthy
docker-compose ps

# If still unhealthy, check logs
docker logs schoolpay-postgres

# Common: container started but not ready yet
# Solution: Wait 10-15 seconds and try again
```

**Issue: Prisma migrations fail**
```bash
# Check what migrations exist
ls prisma/migrations/

# Check migration status
npx prisma migrate status

# If corrupt, reset and rebuild
npx prisma migrate reset --force
npx prisma db push
```

---

### 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│ Next.js 16 (Node.js Runtime)                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  app/api/students/route.ts                             │
│    ↓ (import getTenantPrisma)                          │
│  lib/tenant-prisma.ts (multi-tenant scoping)           │
│    ↓ (uses prisma client)                              │
│  lib/prisma.ts (Prisma Client singleton)               │
│    ↓ (DATABASE_URL)                                    │
│                                                         │
└──────────────────┬──────────────────────────────────────┘
                   │ TCP connection
                   │ port 6543
                   ↓
┌─────────────────────────────────────────────────────────┐
│ Docker Container: schoolpay-postgres                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  PostgreSQL 16 (port 5432 inside container)            │
│    ↓                                                    │
│  Database: schoolpay                                    │
│    ↓                                                    │
│  Tables: School, User, Student, Teacher, Parent, etc. │
│                                                         │
│  Volume: postgres_data (persistent storage)            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### ✅ What NOT to Change

- **lib/prisma.ts** - ✅ Correct as-is (Edge-safe, clean singleton)
- **lib/tenant-prisma.ts** - ✅ Correct as-is (multi-tenant logic works)
- **middleware.ts** - ✅ Correct as-is (Edge-safe, proper exclusions)
- **Prisma schema** - ✅ Correct as-is (already multi-tenant aware)
- **DATABASE_URL format** - ✅ Correct as-is (matches docker-compose config)

---

### 📋 Success Criteria

You'll know everything is working when:

1. ✅ `docker ps` shows schoolpay-postgres running
2. ✅ `psql postgresql://postgres:postgres@localhost:6543/schoolpay -c "SELECT 1"` returns 1
3. ✅ `npm run dev` starts without "Can't reach database" errors
4. ✅ `curl http://localhost:3000/api/db-test` returns connection success
5. ✅ API routes using `getTenantPrisma()` return data without errors
6. ✅ No warnings about Edge Runtime or database connectivity

---

**Ready to execute? Start with Step 1 above.**
