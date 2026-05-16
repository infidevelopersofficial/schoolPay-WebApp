# Production Readiness Checklist

## ✅ Completed (Current Session)
- [x] Database schema applied (migrations ran successfully)
- [x] Prisma client properly initialized with pg adapter
- [x] Admin users seeded (admin@school.com, superadmin@schoolpay.in, admin@schoolpay.com)
- [x] Auth.js configured with credentials provider
- [x] proxy.ts in place for edge-safe auth routing
- [x] middleware.ts removed (deprecated)
- [x] Local dev server starts successfully (`npm run dev`)

## 🔧 TODO Before Production

### 1. **Database: Neon Setup** (CRITICAL)
- [ ] Create Neon account & project at https://console.neon.tech
- [ ] Create a database (e.g., `schoolpay-production`)
- [ ] Obtain connection string (includes DATABASE_URL and DIRECT_URL)
- [ ] Create `.env.production` with Neon URLs
- [ ] Test migration on Neon: `NODE_ENV=production npx prisma migrate deploy`
- [ ] Test connection with a simple query (no credentials in logs)

### 2. **Environment Variables** (CRITICAL)
- [ ] .env.production file created with:
  - `NODE_ENV=production`
  - `DATABASE_URL=` (Neon PostgreSQL pool connection)
  - `DIRECT_URL=` (Neon direct connection for migrations)
  - `NEXTAUTH_URL=` (production domain, e.g., https://schoolpay.com)
  - `AUTH_SECRET=` (generate strong 64-char secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
  - Sentry config (if using error tracking)
- [ ] Verify `.env.production` is NOT in git (check .gitignore)
- [ ] Document where to store secrets (CI/CD, environment variables, secrets manager)

### 3. **Build & Deployment** (CRITICAL)
- [ ] Test build locally: `npm run build`
- [ ] Verify build script can run migrations: `prisma migrate deploy` (requires DATABASE_URL + DIRECT_URL)
- [ ] Check build output size (Next.js 16 / Turbopack optimizations)
- [ ] Set up CI/CD pipeline (GitHub Actions, Vercel, etc.) to:
  - Run migrations before/after deploy
  - Set environment variables securely
  - Build & test before production push

### 4. **Authentication & Security** (HIGH PRIORITY)
- [ ] Rotate AUTH_SECRET (generate new secure value, update .env.production)
- [ ] Verify NEXTAUTH_URL matches production domain
- [ ] Test login flow on production DB
- [ ] Review CORS settings if API accessed from different domain
- [ ] Ensure credentials are NOT logged (check logger config)
- [ ] Test password reset / account recovery flows

### 5. **Sentry / Error Tracking** (MEDIUM)
- [ ] Create Sentry account & project
- [ ] Set NEXT_PUBLIC_SENTRY_DSN in .env.production
- [ ] Set SENTRY_AUTH_TOKEN (for source map uploads during build)
- [ ] Test error reporting in staging environment
- [ ] Configure alerting rules

### 6. **Multi-Tenant Data Isolation** (HIGH PRIORITY)
- [ ] Verify Native RLS (Row-Level Security) is active on all tenant tables
- [ ] Test that users from School A cannot access School B data
- [ ] Review lib/prisma.ts tenant context middleware
- [ ] Test cross-school access scenarios (parent trying to access different school)
- [ ] Check UserSchool linking (ensure proper school-to-user assignment)

### 7. **Performance & Monitoring** (MEDIUM)
- [ ] Configure database connection pooling (PgBouncer for Neon if needed)
- [ ] Review DB_POOL_MAX (default: 10) for expected load
- [ ] Set up monitoring dashboard (Neon console, Prisma Studio, logs)
- [ ] Test under load (artillery, k6, or similar)
- [ ] Monitor slow queries (logs > THRESHOLDS.DB_COMPLEX_QUERY)

### 8. **Migrations & Data** (HIGH)
- [ ] Document migration strategy:
  - All migrations in `prisma/migrations/` are version-controlled
  - Migrations run at build time (package.json: `"build": "prisma migrate deploy && next build"`)
  - Rollback plan if migration fails
- [ ] Test rollback procedure
- [ ] Keep DIRECT_URL separate from DATABASE_URL for migration isolation
- [ ] Document how to add new migrations:
  ```bash
  npx prisma migrate dev --name <migration_name>
  ```

### 9. **Secrets & Configuration** (CRITICAL)
- [ ] Secure all secrets in production environment:
  - AUTH_SECRET (rotate from development value)
  - DATABASE_URL, DIRECT_URL (Neon URLs)
  - SENTRY_AUTH_TOKEN
  - NEXTAUTH_URL (production domain)
- [ ] Use CI/CD secrets manager (GitHub Secrets, Vercel Env Vars, etc.)
- [ ] NO secrets hardcoded in code or .git
- [ ] Document secret rotation schedule

### 10. **Testing & QA** (MEDIUM)
- [ ] End-to-end login test with production DB
- [ ] Test admin dashboard functionality
- [ ] Test multi-tenant isolation
- [ ] Test file uploads (if applicable)
- [ ] Browser compatibility (modern browsers)
- [ ] Mobile responsiveness

### 11. **Deployment Platform** (Choose One)
**Option A: Vercel (Recommended for Next.js)**
- [ ] Connect GitHub repo to Vercel
- [ ] Set environment variables in Vercel dashboard
- [ ] Enable automatic migrations (build step)
- [ ] Set up custom domain & SSL
- [ ] Configure preview deployments

**Option B: Self-Hosted (AWS, DigitalOcean, etc.)**
- [ ] Set up Docker image
- [ ] Configure health checks
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Configure reverse proxy (nginx/Caddy)
- [ ] Set up monitoring & alerting

**Option C: Other (Railway, Render, Fly.io)**
- [ ] Follow platform-specific Next.js deployment docs
- [ ] Ensure PostgreSQL access is secure
- [ ] Set environment variables via platform UI

### 12. **Documentation** (LOW)
- [ ] Document how to deploy (runbook)
- [ ] Document how to add/manage tenants
- [ ] Document admin onboarding procedure
- [ ] Create architecture diagram

---

## Quick Neon Setup Commands

```bash
# 1. Create .env.production
cat > .env.production << 'EOF'
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host/dbname
DIRECT_URL=postgresql://user:password@host/dbname
NEXTAUTH_URL=https://yourdomain.com
AUTH_SECRET=<generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
EOF

# 2. Test migrations
NODE_ENV=production npx prisma migrate deploy

# 3. Build
npm run build

# 4. Start
npm start
```

---

## Neon-Specific Notes
- **DATABASE_URL**: Use Neon's pooled connection (query path)
- **DIRECT_URL**: Use Neon's direct connection (for migrations)
- **Connection limits**: Neon free tier has limits; monitor usage
- **Autosuspend**: Disable for production or configure appropriately
- **Backup**: Neon handles automatic backups; verify retention policy

---

## Risk Summary
- ⚠️ **Local Postgres auth is `trust` mode** — MUST change before any production use
- ⚠️ **AUTH_SECRET is demo value** — MUST rotate
- ⚠️ **Sentry not configured** — errors may not be tracked
- ⚠️ **No CI/CD pipeline set up** — manual deployments risky
