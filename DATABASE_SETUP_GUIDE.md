# 🗄️ Database & Authentication Setup Guide

## ✅ What's Been Completed

### Phase 1: Database Foundation ✅
- [x] Prisma installed and configured
- [x] Complete database schema created (14 models)
- [x] Prisma Client generated
- [x] Database wrapper created (`lib/prisma.ts`)
- [x] Environment variables configured

### Phase 2: Authentication Setup ✅
- [x] NextAuth.js v5 (beta) installed
- [x] bcryptjs for password hashing installed
- [x] Prisma adapter for NextAuth installed

---

## 📋 Database Schema Overview

Your SchoolPay database now includes **14 complete models**:

### Core Models
1. **User** - Authentication & user management (Admin, Teacher, Parent, Student roles)
2. **Student** - Complete student records with fee tracking
3. **Teacher** - Teacher profiles with assignments
4. **Parent** - Parent/guardian information

### Academic Models
5. **Class** - Class sections and capacity
6. **Subject** - Subject definitions
7. **Lesson** - Lesson planning and scheduling
8. **Exam** - Exam scheduling
9. **Result** - Student results with auto-grading
10. **Attendance** - Daily attendance tracking

### Financial Models
11. **Fee** - Fee types and structures
12. **Payment** - Payment records with transactions

### Communication Models
13. **Event** - School events and activities
14. **Message** - Internal messaging
15. **Announcement** - School-wide announcements

---

## 🚀 Next Steps to Complete Setup

### Step 1: Set Up Database

You have **3 options** for your PostgreSQL database:

#### Option A: Local PostgreSQL with Docker (Recommended for Development)
```bash
# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    container_name: schoolpay-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: schoolpay
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
EOF

# Start PostgreSQL
docker-compose up -d

# Your DATABASE_URL will be:
# postgresql://postgres:postgres@localhost:5432/schoolpay
```

#### Option B: Supabase (Free Cloud Database)
1. Go to https://supabase.com
2. Create a new project
3. Get connection string from Settings → Database
4. Use the "Connection pooling" URL for better performance

```bash
# Example Supabase URL:
# postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

#### Option C: Neon (Serverless PostgreSQL)
1. Go to https://neon.tech
2. Create a new project
3. Copy the connection string from dashboard

```bash
# Example Neon URL:
# postgresql://[user]:[password]@[endpoint].neon.tech/[dbname]?sslmode=require
```

### Step 2: Configure Environment Variables

```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env and update DATABASE_URL
# Use the connection string from your chosen database option above
```

### Step 3: Run Database Migration

```bash
# Create and apply the initial migration
npx prisma migrate dev --name init

# This will:
# 1. Create all tables in your database
# 2. Generate Prisma Client
# 3. Apply the schema
```

### Step 4: Seed Initial Data (Optional)

Create a seed script to populate initial data:

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@schoolpay.com',
      hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('Created admin user:', admin.email)

  // Add more seed data as needed
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

```bash
# Add to package.json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}

# Install ts-node
npm install -D ts-node

# Run seed
npx prisma db seed
```

---

## 🔐 Authentication Implementation

### Step 1: Create Auth Configuration

```typescript
// lib/auth.ts
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user || !user.hashedPassword) {
          return null
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password as string,
          user.hashedPassword
        )

        if (!isCorrectPassword) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.role = token.role as string
        session.user.id = token.id as string
      }
      return session
    }
  }
})
```

### Step 2: Create API Route

```typescript
// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth"

export const { GET, POST } = handlers
```

### Step 3: Create Login Page

```typescript
// app/login/page.tsx
"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error("Invalid email or password")
      } else {
        toast.success("Login successful!")
        router.push("/")
        router.refresh()
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">SchoolPay Login</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="admin@schoolpay.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>Default credentials:</p>
            <p className="font-mono">admin@schoolpay.com / admin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

### Step 4: Protect Routes with Middleware

```typescript
// middleware.ts
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnLoginPage = req.nextUrl.pathname.startsWith("/login")

  if (!isLoggedIn && !isOnLoginPage) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (isLoggedIn && isOnLoginPage) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
}
```

### Step 5: Add Session Provider

```typescript
// app/providers.tsx
"use client"

import { SessionProvider } from "next-auth/react"

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
```

```typescript
// Update app/layout.tsx
import { Providers } from "./providers"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  )
}
```

---

## 🔄 Migrating Existing Forms to Use Real Database

### Example: Update Add Student Form

```typescript
// components/forms/add-student-form.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export function AddStudentForm({ open, onOpenChange, onSuccess }: any) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    class: "",
    // ... other fields
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Call API instead of localStorage
      const response = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Failed to add student")

      const student = await response.json()
      toast.success("Student added successfully!")
      setFormData({ name: "", email: "", class: "" })
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error) {
      toast.error("Failed to add student")
    } finally {
      setLoading(false)
    }
  }

  // ... rest of form
}
```

### Create API Route for Students

```typescript
// app/api/students/route.ts
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const students = await prisma.student.findMany({
      include: { parent: true }
    })
    return NextResponse.json(students)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    const student = await prisma.student.create({ data })
    return NextResponse.json(student)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 })
  }
}
```

---

## 📊 Database Management Commands

```bash
# Generate Prisma Client after schema changes
npx prisma generate

# Create a new migration
npx prisma migrate dev --name description_of_changes

# Apply migrations in production
npx prisma migrate deploy

# Open Prisma Studio (Database GUI)
npx prisma studio

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Push schema changes without migration (dev only)
npx prisma db push

# Pull schema from existing database
npx prisma db pull
```

---

## 🎯 Testing the Setup

### 1. Test Database Connection
```bash
npx prisma studio
# Should open http://localhost:5555 with your database
```

### 2. Test Authentication
1. Run seed script to create admin user
2. Navigate to `/login`
3. Login with admin@schoolpay.com / admin123
4. Should redirect to dashboard

### 3. Test API Routes
```bash
# Test creating a student
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Student","email":"test@example.com","class":"Grade 10A"}'
```

---

## 🔒 Security Best Practices

1. **Never commit `.env` file** - Already in `.gitignore`
2. **Use strong passwords** - Minimum 12 characters
3. **Enable SSL in production** - Use `?sslmode=require` in DATABASE_URL
4. **Rotate secrets regularly** - Update NEXTAUTH_SECRET periodically
5. **Use environment-specific configs** - Different DATABASE_URL for dev/prod
6. **Enable database backups** - Supabase/Neon have automatic backups
7. **Monitor database usage** - Set up alerts for connection limits

---

## 🚀 Deployment Checklist

- [ ] Set up production database (Supabase/Neon/Railway)
- [ ] Update DATABASE_URL in production environment
- [ ] Generate strong NEXTAUTH_SECRET
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Seed initial admin user
- [ ] Test authentication flow
- [ ] Enable SSL connections
- [ ] Set up database backups
- [ ] Configure connection pooling
- [ ] Monitor database performance

---

## 📞 Troubleshooting

### Issue: "Can't reach database server"
**Solution**: Check if PostgreSQL is running and DATABASE_URL is correct

### Issue: "Prisma Client not generated"
**Solution**: Run `npx prisma generate`

### Issue: "Migration failed"
**Solution**: Check database permissions and connection

### Issue: "Authentication not working"
**Solution**: Verify NEXTAUTH_SECRET is set and user exists in database

---

## 🎉 What's Next?

Once database and auth are set up:

1. ✅ Migrate all 14 forms to use API routes
2. ✅ Update table components to fetch from database
3. ✅ Add role-based access control
4. ✅ Implement edit/delete functionality
5. ✅ Add search and filtering with Prisma
6. ✅ Set up file uploads for avatars
7. ✅ Add email notifications
8. ✅ Implement payment gateway

---

**Status**: Database schema ready, Prisma configured, NextAuth installed  
**Next Step**: Choose database option and run migration  
**Estimated Time**: 30 minutes to complete setup

🚀 **Ready to go production with real database and authentication!**
