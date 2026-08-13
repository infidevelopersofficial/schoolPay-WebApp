# SchoolPay — Production Implementation & Enhancement Guide

**Last Updated**: July 2026  
**Status**: Core Create/Read Working | Edit/Update/Delete/Export Gaps Remain  
**Current Phase**: CRUD Completion → Feature Enhancement

---

## Executive Summary

SchoolPay has a solid foundation with **55+ database models**, **34 DAL modules**, **26 dashboard routes**, and **12 create forms**. Core infrastructure (multi-tenancy, RLS, auth, payments, reports) is production-grade.

**What's complete:**
- ✅ Multi-tenant architecture with PostgreSQL Native RLS
- ✅ Authentication & RBAC (7 roles: SUPER_ADMIN, ADMIN, ACCOUNTANT, TEACHER, PARENT, STUDENT, SCHOOLPAY_TEAM)
- ✅ Create forms for all 14+ modules
- ✅ List/Read pages for all modules
- ✅ Financial reports with CSV/PDF export
- ✅ Razorpay payment gateway (orders + webhooks + verification)
- ✅ SMS OTP via MSG91 for parent portal
- ✅ Cron jobs (fee reminders, attendance digests, recurring expenses)
- ✅ Parent Portal + Student Portal
- ✅ Billing & subscription management
- ✅ Survey system with analytics

- ✅ Edit/Update UI forms (dedicated edit pages for all core modules)
- ✅ Delete actions for 7+ modules
- ✅ View/Detail pages for all core modules (Students, Exams, Teachers, Parents, Classes, Subjects, Fees, Payments)
**What's NOT complete:**
- ✅ Data export (CSV/PDF) on individual data tables (7 core tables)
- ✅ Bulk CSV import for Students, Teachers, Parents with atomic transactions

---

## Phases 1-8: Audit Roadmap Completion Summary

- [x] Phase 1: Edit/Update Forms — dedicated /[id]/edit pages for all core entities (Students, Teachers, Parents, Classes, Subjects, Lessons, Events, Announcements; Messages intentionally omitted as immutable)
- [x] Phase 2: View/Detail Pages — detail pages for Students, Exams, Teachers, Parents, Classes, Subjects, Fees, Payments
- [x] Phase 3: Complete Delete Actions — soft delete (isActive=false) for Announcements, FeeStructure; status=CANCELLED for Lessons, Events; status=FAILED for Payments (PENDING only); hard delete with server-side guard for Subjects; Messages omitted (immutable)
- [x] Phase 4: Import/Export on Tables — DataTableExport (CSV/PDF) wired into 7 tables; bulk CSV import for Students, Teachers, Parents with atomic per-row transactions; Fee Structure import explicitly deferred
- [x] Phase 5: Student Promotion — StudentAcademicHistory schema, promotion DAL with single transaction, preview UI with per-student Promote/Detain/Exclude toggle
- [x] Phase 6: Audit Trail Viewer — filterable paginated table reading from AuditLog with expandable before/after JSON diff
- [x] Phase 7: Timetable Management — Timetable + TimetablePeriod schema, weekly grid UI, teacher conflict detection
- [x] Phase 8: Expense Enhancements — custom ExpenseCategory model with admin CRUD, approval workflow (PENDING/APPROVED/REJECTED) with isAdmin-gated approve/reject buttons, REJECTED expenses excluded from P&L

> **Note on Currency Storage**: `Expense.amount` is strictly stored in **paise** (Integer, e.g., 5000 = ₹50). The UI layer correctly handles this by dividing by 100 before formatting. This is distinct from `FeeItem.amount`, which is stored directly in **rupees** (Integer).

---

## Future / Deferred Features
- [ ] Refactor Parent-Student Assignment: Replace the flat capped `getStudents({ limit: 1000 })` list with a server-side async typeahead.
- [ ] Email & WhatsApp API Integrations for automated notifications.
- [ ] Advanced Analytics (Performance, Forecasting)
- [ ] Multi-Language Support (Hindi, Tamil, Telugu)

---

## Technical Debt

### Code Quality
- [ ] Add E2E tests (Playwright — already in devDependencies)
- [ ] Increase unit test coverage

### Database
- [ ] Index optimization for slow queries
- [ ] Query performance profiling
- [ ] Backup automation

### DevOps
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Staging environment
- [ ] Database migration rollback strategy

---

## Technical Debt & Known Limitations
- `getStudents({ limit: 1000 })` is used in some forms (like Parent edit) instead of a paginated or typeahead search. If a school exceeds this limit, parents might silently fail to see their child in the dropdown.
- **Relational Integrity**: `Student.class` and `Lesson.subject` are stored as plain strings with no FK to `Class`/`Subject` models. Class and subject detail pages use string matching which can silently miss records if names are inconsistent. Future migrations must add proper FK relations.
- **Migration History non-replayable**: Multiple historical SQL files are out of sync with the actual DB state (confirmed by repeated shadow DB failures). This permanently blocks `prisma migrate dev`. All future schema changes must use `--create-only` to generate SQL manually, then be applied directly via `prisma db execute` or `psql`. Subject model cannot be given isActive soft-delete until migration history is repaired or DB is reset. Hard delete with server-side guard (block if active TeacherSubject or Exam rows exist) is the permanent approach for Subject deletion.

## Version History

| Version | Date | Status | Features |
|---------|------|--------|----------|
| 0.1.0 | May 2026 | Released | Core create/read for 14 modules |
| 0.2.0 | Jun 2026 | Released | Exams, grading schemes, report cards |
| 0.3.0 | Jun 2026 | Released | Campaigns, surveys, communications |
| 0.4.0 | Jul 2026 | Released | Student validation hardening, teacher assignments |
| 0.5.0 | August 5, 2026 | Released | Edit forms, detail pages, delete actions, complete CRUD |
| 0.5.1 | August 9, 2026 | Released | Phase 2 complete — all detail/view pages, Phase 3 complete — delete actions |
| 0.6.0 | Planned | Planned | Import/export on all tables |
| 0.7.0 | Planned | Planned | Timetable, promotions, audit viewer |

---

*Last updated: August 2026*
