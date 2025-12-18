# Forms Integration Guide

This guide shows how to integrate all the Add/Create forms into their respective pages.

## ✅ Completed Integrations

### 1. Students Page
- **Form**: `AddStudentForm`
- **Status**: ✅ Integrated
- **Button**: "Add Student"

## 🔄 Pending Integrations

### 2. Teachers Page (`app/teachers/page.tsx`)
```typescript
"use client"
import { useState } from "react"
import { AddTeacherForm } from "@/components/forms"

// Add state
const [showAddForm, setShowAddForm] = useState(false)
const [refreshKey, setRefreshKey] = useState(0)

// Update button
<Button onClick={() => setShowAddForm(true)}>Add Teacher</Button>

// Add form component
<AddTeacherForm open={showAddForm} onOpenChange={setShowAddForm} onSuccess={() => setRefreshKey(prev => prev + 1)} />
```

### 3. Parents Page (`app/parents/page.tsx`)
```typescript
import { AddParentForm } from "@/components/forms"
<AddParentForm open={showAddForm} onOpenChange={setShowAddForm} onSuccess={handleSuccess} />
```

### 4. Subjects Page (`app/subjects/page.tsx`)
```typescript
import { AddSubjectForm } from "@/components/forms"
<AddSubjectForm open={showAddForm} onOpenChange={setShowAddForm} onSuccess={handleSuccess} />
```

### 5. Classes Page (`app/classes/page.tsx`)
```typescript
import { AddClassForm } from "@/components/forms"
<AddClassForm open={showAddForm} onOpenChange={setShowAddForm} onSuccess={handleSuccess} />
```

### 6. Lessons Page (`app/lessons/page.tsx`)
```typescript
import { CreateLessonForm } from "@/components/forms"
<CreateLessonForm open={showAddForm} onOpenChange={setShowAddForm} onSuccess={handleSuccess} />
```

### 7. Exams Page (`app/exams/page.tsx`)
```typescript
import { ScheduleExamForm } from "@/components/forms"
<ScheduleExamForm open={showAddForm} onOpenChange={setShowAddForm} onSuccess={handleSuccess} />
```

### 8. Results Page (`app/results/page.tsx`)
```typescript
import { UploadResultForm } from "@/components/forms"
<UploadResultForm open={showAddForm} onOpenChange={setShowAddForm} onSuccess={handleSuccess} />
```

### 9. Attendance Page (`app/attendance/page.tsx`)
```typescript
import { MarkAttendanceForm } from "@/components/forms"
<MarkAttendanceForm open={showAddForm} onOpenChange={setShowAddForm} onSuccess={handleSuccess} />
```

### 10. Events Page (`app/events/page.tsx`)
```typescript
import { CreateEventForm } from "@/components/forms"
<CreateEventForm open={showAddForm} onOpenChange={setShowAddForm} onSuccess={handleSuccess} />
```

### 11. Messages Page (`app/messages/page.tsx`)
```typescript
import { ComposeMessageForm } from "@/components/forms"
<ComposeMessageForm open={showAddForm} onOpenChange={setShowAddForm} onSuccess={handleSuccess} />
```

### 12. Announcements Page (`app/announcements/page.tsx`)
```typescript
import { NewAnnouncementForm } from "@/components/forms"
<NewAnnouncementForm open={showAddForm} onOpenChange={setShowAddForm} onSuccess={handleSuccess} />
```

### 13. Fees Page (`app/fees/page.tsx`)
```typescript
import { AddFeeForm } from "@/components/forms"
<AddFeeForm open={showAddForm} onOpenChange={setShowAddForm} onSuccess={handleSuccess} />
```

### 14. Payments Page (`app/payments/page.tsx`)
```typescript
import { RecordPaymentForm } from "@/components/forms"
<RecordPaymentForm open={showAddForm} onOpenChange={setShowAddForm} onSuccess={handleSuccess} />
```

## Database Integration

All forms are connected to the database service (`lib/db/database.ts`) which:
- Stores data in localStorage for persistence
- Provides CRUD operations for all entities
- Auto-generates IDs for new records
- Maintains referential integrity

## Usage Pattern

1. Import the form component
2. Add state for form visibility and refresh
3. Connect button to open form
4. Add form component with handlers
5. Pass refresh key to data tables

## Testing

After integration, test each form:
1. Click the Add/Create button
2. Fill in required fields
3. Submit the form
4. Verify data appears in the table
5. Check localStorage for persistence
