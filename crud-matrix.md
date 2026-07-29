# CRUD Operations Matrix

> **Last verified**: July 2026  
> ✅ = Working in UI | ⚙️ = DAL exists, no UI | ❌ = Not implemented

| Module | Create | Read/List | View `[id]` | Update/Edit | Delete | Bulk Import | Export |
|--------|--------|-----------|-------------|-------------|--------|-------------|--------|
| Students | ✅ Form | ✅ Table | ✅ Detail Page | ⚙️ DAL only | ✅ Action | ✅ CSV | ❌ |
| Teachers | ✅ Form | ✅ Table | ❌ | ⚙️ DAL only | ✅ Action | ❌ | ❌ |
| Parents | ✅ Form | ✅ Table | ❌ | ⚙️ DAL only | ✅ Action | ❌ | ❌ |
| Classes | ✅ Form | ✅ Table | ❌ | ⚙️ DAL only | ✅ Action | ❌ | ❌ |
| Subjects | ✅ Form | ✅ Table | ❌ | ❌ | ❌ | ❌ | ❌ |
| Lessons | ✅ Form | ✅ Table | ❌ | ❌ | ❌ | ❌ | ❌ |
| Exams | ✅ Form | ✅ Table | ✅ Detail Page | ❌ | ❌ | ❌ | ❌ |
| Results | ✅ Bulk Entry | ✅ Table | ❌ | ❌ | ❌ | ❌ | ✅ Report Card PDF |
| Attendance | ✅ Bulk Mark | ✅ Table | ❌ | ❌ | ❌ | ❌ | ❌ |
| Fees | ✅ Wizard | ✅ Table | ❌ | ❌ | ❌ | ❌ | ❌ |
| Payments | ✅ Form | ✅ Table | ❌ | ❌ | ❌ | ❌ | ❌ |
| Events | ✅ Form | ✅ Table | ❌ | ❌ | ❌ | ❌ | ❌ |
| Messages | ✅ Form | ✅ Table | ❌ | ❌ | ❌ | ❌ | ❌ |
| Announcements | ✅ Form | ✅ Table | ❌ | ❌ | ❌ | ❌ | ❌ |
| Expenses | ✅ Form | ✅ Table | ❌ | ❌ | ✅ Action | ❌ | ❌ |
| Leads | ✅ Form | ✅ Table | ❌ | ✅ Status only | ❌ | ❌ | ❌ |
| Batches | ✅ Form | ✅ Table | ❌ | ✅ Action | ❌ | ❌ | ❌ |
| Surveys | ✅ Form | ✅ Table | ✅ Detail | ✅ Full | ✅ Action | ❌ | ❌ |
| Communications | ✅ Builder | ✅ Table | ❌ | ❌ | ❌ | ❌ | ❌ |
| Reports | N/A | ✅ | N/A | N/A | N/A | N/A | ✅ CSV + PDF |

## Priority Gaps

1. **Edit/Update UI**: Forms exist only for creation — no edit mode for Students, Teachers, Parents, Classes, Subjects, Lessons, Events, etc. (Will be resolved via dedicated `/[entity]/[id]/edit` pages).
2. **Detail/View Pages**: Only Students and Exams have `[id]` detail pages.
3. **Delete Actions**: Missing for Subjects, Lessons, Events, Messages, Announcements, Fees, Payments. (Will use `isActive = false` soft deletes).
4. **Data Export**: Only available in the Reports module — not on individual data tables.
5. **Bulk Import**: Only Students support CSV import.
