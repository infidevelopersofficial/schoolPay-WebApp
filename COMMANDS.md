# Copy-Paste Commands - PostgreSQL + Prisma Setup

## Start PostgreSQL (One Time)

```bash
cd /home/somesh/Codework/SchoolPay/school-fees-management
docker-compose up -d
```

**Expected:** Container starts and becomes healthy in ~10 seconds

## Start Development (Daily)

```bash
# Terminal 1: Database (if not already running)
docker-compose up -d

# Terminal 2: Dev Server
npm run dev
```

**Expected:** 
- `✓ Ready in ~1.5s`
- Server on http://localhost:3000
- No "Can't reach database" errors

## Verify Setup Works

```bash
# Check database is healthy
docker-compose ps

# Check Prisma can connect
curl http://localhost:3000/api/students
# Expected: {"error":"Unauthorized..."} (401 is fine, means DB works)
```

## View Database Data

```bash
# Open Prisma Studio (GUI)
npx prisma studio
```

## Stop Everything

```bash
# Stop database (data is persistent, won't be deleted)
docker-compose down

# Stop dev server
Ctrl+C in terminal
```

## Production Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

**Important:** Update DATABASE_URL to your production PostgreSQL before running.

## Emergency Reset (if something breaks)

```bash
# WARNING: This deletes all data!
docker-compose down -v
docker-compose up -d
sleep 10
npx prisma db push
npm run dev
```

## Quick Troubleshooting

**"Can't reach database server"**
```bash
docker-compose ps
# If not running: docker-compose up -d
```

**"Port 6543 already in use"**
```bash
lsof -i :6543
kill -9 <PID>
docker-compose up -d
```

**"Connection refused"**
```bash
# Wait 10-15 seconds after docker-compose up -d
sleep 15
docker-compose ps
# Should show "Up (healthy)"
```

---

**That's it! Your database is ready. Start building!**
