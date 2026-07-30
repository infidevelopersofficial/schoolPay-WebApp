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

**What's NOT complete:**
- ❌ Edit/Update UI forms (DAL functions exist but no frontend)
- ❌ View/Detail pages (only Students and Exams have `[id]` pages)
- ❌ Delete actions for 7+ modules
- ❌ Data export on individual data tables
- ❌ Bulk import for Teachers, Parents, Fees

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
- [ ] Students (`components/forms/add-student-form.tsx`)
- [ ] Teachers (`components/forms/add-teacher-form.tsx`)
- [ ] Parents (`components/forms/add-parent-form.tsx`)
- [ ] Classes (`components/forms/add-class-form.tsx`)
- [ ] Subjects (`components/forms/add-subject-form.tsx`)
- [ ] Lessons (`components/forms/create-lesson-form.tsx`)
- [ ] Events (`components/forms/create-event-form.tsx`)
- [ ] Announcements (`components/forms/new-announcement-form.tsx`)

### 1.2 View/Detail Pages (Phase 2)
**Priority**: 🔴 CRITICAL | **Effort**: 4-5 days

- [ ] Teachers `[id]` — profile, subjects, classes, schedule
- [ ] Parents `[id]` — contact info, linked students, fee summary
- [ ] Classes `[id]` — student roster, class teacher, attendance stats
- [ ] Subjects `[id]` — assigned teachers, exam history
- [ ] Fees `[id]` — structure detail, mapped classes, collection progress
- [ ] Payments `[id]` — full receipt view, transaction detail

### 1.3 Complete Delete Actions (Phase 3: Soft-Delete Actions)
**Priority**: 🟡 HIGH | **Effort**: 2-3 days

- [ ] Add delete DAL functions for: Subjects, Lessons, Events, Messages, Announcements, Fees, Payments
- [ ] Wire delete actions with `withTenantAuth`
- [ ] Build reusable `ConfirmDeleteDialog` component (replace `window.confirm`)

### 1.4 Action Columns in Tables
**Priority**: 🟡 HIGH | **Effort**: 2 days

Add View / Edit / Delete dropdown menu to all table components:
- [ ] `students-table.tsx`
- [ ] `teachers-table.tsx`
- [ ] `parents-table.tsx`
- [ ] `classes-table.tsx`
- [ ] `subjects-table.tsx`

---

## Phase 2: Import/Export (Week 3)

### 2.1 Data Export on All Tables
**Priority**: 🟡 HIGH | **Effort**: 2-3 days

- [ ] Build reusable `DataTableExport` component (CSV + PDF buttons)
- [ ] Add to: Students, Teachers, Parents, Classes, Subjects, Fees, Payments, Attendance
- [ ] Uses existing `jsPDF` + `jspdf-autotable` + `papaparse`

### 2.2 Bulk Import for Additional Entities
**Priority**: 🟡 HIGH | **Effort**: 2-3 days

- [ ] Teachers CSV import (follow student import pattern)
- [ ] Parents CSV import
- [ ] Fee structure CSV import

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
- [ ] Bulk promote students between classes/sessions
- [ ] Preview before commit
- [ ] Transfer attendance/fee records

### Phase 6: Audit Trail Viewer
- [ ] UI for existing `AuditLog` table
- [ ] Filter by entity, action, user, date
- [ ] Before/after diff viewer

### Phase 7: Timetable Management
- [ ] Timetable model (Day × Period × Subject × Teacher)
- [ ] Weekly grid view
- [ ] Teacher schedule view
- [ ] Conflict detection

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
- [ ] Remove temp/debug files from project root (19 test-output files, audit scripts, etc.)

### Database
- [ ] Index optimization for slow queries
- [ ] Query performance profiling
- [ ] Backup automation

### DevOps
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Staging environment
- [ ] Database migration rollback strategy

---

## Version History

| Version | Date | Status | Features |
|---------|------|--------|----------|
| 0.1.0 | May 2026 | Released | Core create/read for 14 modules |
| 0.2.0 | Jun 2026 | Released | Exams, grading schemes, report cards |
| 0.3.0 | Jun 2026 | Released | Campaigns, surveys, communications |
| 0.4.0 | Jul 2026 | Released | Student validation hardening, teacher assignments |
| 0.5.0 | Planned | In Progress | Edit forms, detail pages, complete CRUD |
| 0.6.0 | Planned | Planned | Import/export on all tables |
| 0.7.0 | Planned | Planned | Timetable, promotions, audit viewer |

---

*Last updated: July 2026*
