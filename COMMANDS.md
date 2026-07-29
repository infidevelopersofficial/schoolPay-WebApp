# SchoolPay — Developer Commands Reference

> All commands assume you're in the project root directory.

---

## Daily Development

```bash
# Start Docker PostgreSQL (if using local DB)
npm run db:start

# Start the dev server
npm run dev
# → http://localhost:3000
```

## Database Commands

```bash
# Start/Stop local PostgreSQL (Docker)
npm run db:start          # docker compose up -d
npm run db:stop           # docker compose down

# Migrations
npm run db:deploy         # Apply all migrations (prisma migrate deploy)
npm run db:migrate        # Create new migration (prisma migrate dev)

# Seeding
npm run db:seed           # Seed default school + admin user

# GUI
npm run db:studio         # Open Prisma Studio (http://localhost:5555)

# Full setup (start → wait → migrate → seed)
npm run db:setup

# ⚠️ Destructive: Reset everything
npm run db:reset          # prisma migrate reset --force
```

## Build & Production

```bash
# Production build (generates Prisma client + builds Next.js)
npm run build

# Start production server
npm start

# Lint check
npm run lint
```

## Prisma Commands

```bash
# Generate Prisma Client (after schema changes)
npx prisma generate

# Create a new migration
npx prisma migrate dev --name <migration_name>

# Apply migrations to production
npx prisma migrate deploy

# Validate schema
npx prisma validate

# Format schema file
npx prisma format

# Open database GUI
npx prisma studio
```

## Troubleshooting

**"Can't reach database server"**
```bash
# Check if Docker container is running
docker compose ps
# If not running:
npm run db:start
# Wait ~10 seconds for PostgreSQL to initialize
```

**"Port 6543 already in use" (Windows)**
```powershell
netstat -ano | findstr :6543
taskkill /PID <PID> /F
npm run db:start
```

**"Port 6543 already in use" (Linux/Mac)**
```bash
lsof -i :6543
kill -9 <PID>
npm run db:start
```

**Stale build cache causing ghost errors**
```powershell
# Delete .next and restart on Windows PowerShell:
Remove-Item -Recurse -Force .next
npm run dev
```

**Prisma Client out of sync with schema**
```bash
npx prisma generate
npm run dev
```

---

*Last updated: July 2026*
