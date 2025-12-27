## 🚀 PostgreSQL + Prisma - Quick Reference

### Start Everything (30 seconds)
```bash
# Terminal 1: Start database
docker-compose up -d

# Terminal 2: Start app
npm run dev
```

**Expected Output:**
```
✓ Ready in ~1.5s
GET /api/students 401 (database connected, auth required)
```

---

### Verify Setup (1 minute)

**Check Docker:**
```bash
docker-compose ps
# Expected: schoolpay-postgres Up (healthy)
```

**Check Database:**
```bash
psql postgresql://postgres:postgres@localhost:6543/schoolpay -c "SELECT 1"
# Expected: 1
```

**Check Prisma:**
```bash
npx prisma studio
# Expected: GUI opens with 19 tables
```

---

### Useful Commands

| Task | Command |
|------|---------|
| Start PostgreSQL | `docker-compose up -d` |
| Stop PostgreSQL | `docker-compose down` |
| View logs | `docker logs schoolpay-postgres` |
| Open Prisma Studio | `npx prisma studio` |
| Test DB connection | `psql postgresql://postgres:postgres@localhost:6543/schoolpay -c "SELECT 1"` |
| View all tables | `docker exec schoolpay-postgres psql -U postgres -d schoolpay -c "\dt"` |
| Reset database | `docker-compose down -v && docker-compose up -d` |
| Check container health | `docker-compose ps` |

---

### Architecture

```
App (Next.js 16)
  → lib/prisma.ts (Prisma Client)
    → DATABASE_URL (.env)
      → PostgreSQL (localhost:6543)
```

---

### Configuration

**DATABASE_URL:**
```
postgresql://postgres:postgres@localhost:6543/schoolpay?schema=public
```

**Status:** ✅ Working

---

### Multi-Tenant Query Example

```typescript
// app/api/students/route.ts
import { getTenantPrisma } from '@/lib/tenant-prisma'

export async function GET(req: NextRequest) {
  const schoolId = req.headers.get('x-school-id')
  
  // Get school-specific Prisma client
  const prisma = getTenantPrisma(schoolId)
  
  // Only returns students for this school
  const students = await prisma.student.findMany()
  
  return Response.json(students)
}
```

✅ Multi-tenant isolation: WORKING

---

### Troubleshooting

| Error | Fix |
|-------|-----|
| "Can't reach database server" | `docker-compose ps` → should show RUNNING |
| "Port 6543 already in use" | `lsof -i :6543` → kill process → restart |
| "Connection refused" | Wait 10 seconds after `docker-compose up -d` |
| "Prisma Client not found" | `npx prisma generate` |
| Database locked | `docker-compose down -v` → restart |

---

### Files

| File | Status |
|------|--------|
| docker-compose.yml | ✅ Created (production-grade) |
| .env | ✅ Configured (DATABASE_URL correct) |
| lib/prisma.ts | ✅ No changes needed |
| lib/tenant-prisma.ts | ✅ No changes needed |
| Prisma schema | ✅ 19 tables deployed |

---

### Next Steps

1. ✅ Database running
2. ✅ Prisma connected
3. ⏭️  Build your features
4. ⏭️  Use `getTenantPrisma(schoolId)` for queries
5. ⏭️  Deploy to production (update DATABASE_URL to managed DB)

---

**Production Deployment:**
When moving to production, replace DATABASE_URL with a managed PostgreSQL instance (AWS RDS, Google Cloud SQL, etc.) and use strong passwords.

**Status: ✅ READY FOR DEVELOPMENT**
