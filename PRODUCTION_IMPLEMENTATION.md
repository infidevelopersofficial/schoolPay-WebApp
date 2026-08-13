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

## Phase 1: Edit Forms (Dedicated Pages) (CRITICAL — Week 1-2)

### 1.1 Edit/Update Forms
**Priority**: 🔴 CRITICAL | **Effort**: 5-6 days

Every add form needs an edit mode. The DAL already has `updateStudent()`, `updateTeacher()`, `updateClass()`, etc.

**Implementation approach:**
- Use dedicated `/[entity]/[id]/edit` pages for all edits (no modals).
- Add `initialData` prop to each form component
- When present, pre-fill fields and switch submit to update action

**Modules needing edit forms:**
- [x] Students (`components/forms/add-student-form.tsx`)
- [x] Teachers (`components/forms/add-teacher-form.tsx`)
- [x] Parents (`components/forms/add-parent-form.tsx`)
- [x] Classes (`components/forms/add-class-form.tsx`)
- [x] Subjects (`components/forms/add-subject-form.tsx`)
- [x] Lessons (`components/forms/create-lesson-form.tsx`)
- [x] Events (`components/forms/create-event-form.tsx`)
- [x] Announcements (`components/forms/new-announcement-form.tsx`)
*(Note: Messages are intentionally omitted from this list because sent messages are immutable by design in standard communication systems. They cannot be edited after sending.)*

### 1.2 View/Detail Pages (Phase 2)
**Priority**: 🔴 CRITICAL | **Effort**: 4-5 days

- [ ] Teachers `[id]` — profile, subjects, classes, schedule
- [ ] Parents `[id]` — contact info, linked students, fee summary
- [ ] Classes `[id]` — student roster, class teacher, attendance stats
- [ ] Subjects `[id]` — assigned teachers, exam history
- [x] Fees `[id]` — structure detail, mapped classes, collection progress
- [x] Payments `[id]` — full receipt view, transaction detail

### 1.3 Complete Delete Actions (Phase 3) (✅ Completed August 9, 2026)
**Priority**: 🟡 HIGH | **Effort**: 2-3 days

- [x] Delete actions implemented with proper server-side safeguards and the following patterns:
  - `isActive = false` (Soft delete): Announcements, FeeStructure
  - `status = "CANCELLED"`: Lessons, Events
  - `status = "FAILED"`: Payments (restricted to PENDING only; blocked if COMPLETED)
  - Hard delete with server-side guard: Subjects (blocked if active TeacherSubject or Exam rows exist)
  - Omitted (immutable): Messages
- [x] Wire delete actions with `withTenantAuth`
- [x] Build reusable `ConfirmDeleteDialog` component (replace `window.confirm`)

### 1.4 Action Columns in Tables
**Priority**: 🟡 HIGH | **Effort**: 2 days

Add View / Edit / Delete dropdown menu to all table components:
- [x] `students-table.tsx`
- [x] `teachers-table.tsx`
- [x] `parents-table.tsx`
- [x] `classes-table.tsx`
- [x] `subjects-table.tsx`
- [x] `lessons-table.tsx`
- [x] `events-table.tsx`
- [x] `payments-table.tsx`
- [x] `invoices-table.tsx`
- [x] `fees-content.tsx`
- [x] `announcements-client.tsx` (Intentionally card-based, inline buttons are correct UX)

---

## Phase 2: Import/Export (✅ Completed)

### 2.1 Data Export on All Tables
**Priority**: 🟡 HIGH | **Effort**: Completed

- [x] Build reusable `DataTableExport` component (CSV + PDF buttons)
- [x] Wired into 7 core tables

### 2.2 Bulk Import for Additional Entities
**Priority**: 🟡 HIGH | **Effort**: Completed

- [x] Students CSV import with per-row atomic transactions
- [x] Teachers CSV import
- [x] Parents CSV import
- ⏸️ *Fee structure CSV import EXPLICITLY DEFERRED: A fee structure requires a complex relational tree (base structure → multiple fee items → multiple class mappings). Flattening this 1-to-Many-to-Many relationship into CSV is brittle and prone to data corruption. The interactive UI Wizard remains the safest and primary path.*

---

## Phase 3: Communication & Notifications (Week 4-5)

### 3.1 Email Notifications
**Priority**: 🟡 HIGH | **Effort**: 3-4 days

- [ ] Email templates for: payment reminders, absence alerts, exam schedules, result notifications
- [ ] Integration with Resend or nodemailer (nodemailer already in dependencies)
- [ ] Email queue for async processing

### 3.2 WhatsApp Integration
**Priority**: 🟢 MEDIUM | **Effort**: 2-3 days

- [ ] WhatsApp Business API integration
- [ ] Template messages for fee reminders and attendance

---

## Phase 4: Frontend UI Optimizations
- [ ] Refactor Parent-Student Assignment: Replace the flat capped `getStudents({ limit: 1000 })` list with a server-side async typeahead (Select/ComboBox) to prevent data loss or silent unlinking for schools exceeding 1,000 students.

## Phase 5-8: Advanced Features (Month 2+)

### Phase 5: Student Promotion
- [x] Bulk promote students between classes/sessions
- [x] Preview before commit
- [x] Transfer attendance/fee records

### Phase 6: Audit Trail Viewer
- [x] UI for existing `AuditLog` table
- [x] Filter by entity, action, user, date
- [x] Before/after diff viewer

### Phase 7: Timetable Management
- [x] Timetable model (Day × Period × Subject × Teacher)
- [x] Weekly grid view
- [x] Teacher schedule view
- [x] Conflict detection

### Phase 8: Expense Enhancements
- [ ] Add expense categories management (salary, maintenance, stationery, etc.)
- [ ] Add recurring expense auto-generation
- [ ] Add expense approval workflow
- [ ] Add expense vs. income comparison chart

### Future/Deferred
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
