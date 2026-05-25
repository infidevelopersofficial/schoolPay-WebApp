const fs = require("fs");

// 1. Fix InvoicePaymentCard.tsx
let inv = fs.readFileSync("components/parent-portal/InvoicePaymentCard.tsx", "utf-8");
inv = inv.replace(/description: `Fee Payment for \${studentName}`,/, 'description: `Fee Payment for ${studentName}`,');
// Actually, let's just do a clean replace using split/join to avoid regex syntax hell
inv = inv.split("description: `Fee Payment for ${studentName}`").join('description: `Fee Payment for ${studentName}`');
fs.writeFileSync("components/parent-portal/InvoicePaymentCard.tsx", inv);

// Let's rewrite InvoicePaymentCard entirely to fix the template literal.
let correctInv = `"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, IndianRupee, Loader2 } from "lucide-react"
import { createFeePaymentOrder, verifyFeePayment } from "@/app/(parent-portal)/parent/fees/actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Invoice {
  id: string
  invoiceNo: string
  total: number
  dueDate: Date | null
  status: string
}

interface InvoicePaymentCardProps {
  invoice: Invoice
  studentName: string
}

export function InvoicePaymentCard({ invoice, studentName }: InvoicePaymentCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    try {
      setLoading(true)

      // 1. Create Order
      const { orderId, amount, currency, keyId, error } = await createFeePaymentOrder(invoice.id)
      
      if (error) {
        toast.error(error)
        setLoading(false)
        return
      }

      // 2. Load Razorpay script if not already loaded
      if (!(window as any).Razorpay) {
        await new Promise((resolve) => {
          const script = document.createElement("script")
          script.src = "https://checkout.razorpay.com/v1/checkout.js"
          script.onload = resolve
          document.body.appendChild(script)
        })
      }

      // 3. Open Razorpay Checkout
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: "SchoolPay",
        description: "Fee Payment for " + studentName,
        order_id: orderId,
        handler: async function (response: any) {
          const result = await verifyFeePayment(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature,
            invoice.id
          )

          if (result.error) {
            toast.error(result.error)
          } else {
            toast.success("Payment successful!")
            router.refresh()
          }
        },
        prefill: {
          name: studentName,
        },
        theme: {
          color: "#6d28d9", // violet-700
        },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.on("payment.failed", function (response: any) {
        toast.error(response.error.description || "Payment failed")
      })
      rzp.open()
    } catch (err: any) {
      toast.error(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-500" />
            {invoice.invoiceNo}
          </CardTitle>
          <Badge
            variant="outline"
            className={
              invoice.status === "PAID"
                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                : "bg-red-100 text-red-700 border-red-200"
            }
          >
            {invoice.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between mt-2">
          <div>
            <p className="text-xs text-slate-500 mb-1">Total Amount</p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
              ₹{invoice.total.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 mb-1">Due Date</p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-IN") : "N/A"}
            </p>
          </div>
        </div>
      </CardContent>
      {invoice.status === "PENDING" && (
        <CardFooter className="pt-2">
          <Button 
            className="w-full bg-violet-600 hover:bg-violet-700" 
            onClick={handlePayment} 
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <IndianRupee className="w-4 h-4 mr-2" />}
            Pay Now
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
`
fs.writeFileSync("components/parent-portal/InvoicePaymentCard.tsx", correctInv);

// 2. Fix page.tsx (Student Detail)
let page = fs.readFileSync("app/(parent-portal)/parent/students/[id]/page.tsx", "utf-8");
page = page.split('`Class ${batch.grade}${batch.section ? ` ${batch.section}` : ""} ` : `Class ${profile.class}`').join('batch ? `Class ${batch.grade}${batch.section ? ` ${batch.section}` : ""}` : `Class ${profile.class}`}');
page = page.split('`att-${a.id}`').join('`att-${a.id}`'); // Actually it's probably escaped incorrectly. Let's just fix the whole file.

let correctPage = `import { getStudentProfile, getStudentTimeline } from "@/lib/dal/parent-portal"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  GraduationCap,
  Calendar,
  IndianRupee,
  Star,
  ClipboardList,
  CheckCircle,
  XCircle,
  Download,
  Clock,
  Bell,
  AlertTriangle,
  Megaphone,
  User
} from "lucide-react"
import { cn } from "@/lib/utils"

export const metadata = {
  title: "Student Profile — Parent Portal",
}

function feeStatusColor(status: string) {
  if (status === "PAID") return "bg-emerald-100 text-emerald-700 border-emerald-200"
  if (status === "OVERDUE") return "bg-red-100 text-red-700 border-red-200"
  if (status === "PARTIAL") return "bg-amber-100 text-amber-700 border-amber-200"
  return "bg-slate-100 text-slate-600 border-slate-200"
}

function getTimelineIcon(type: string) {
  switch (type) {
    case "ATTENDANCE_MARKED": return <ClipboardList className="h-4 w-4" />
    case "RESULT_PUBLISHED": return <Star className="h-4 w-4" />
    case "PAYMENT_RECEIVED": return <IndianRupee className="h-4 w-4" />
    case "ANNOUNCEMENT_POSTED": return <Megaphone className="h-4 w-4" />
    default: return <Bell className="h-4 w-4" />
  }
}

function getTimelineColor(type: string) {
  switch (type) {
    case "ATTENDANCE_MARKED": return "bg-blue-100 text-blue-700"
    case "RESULT_PUBLISHED": return "bg-purple-100 text-purple-700"
    case "PAYMENT_RECEIVED": return "bg-emerald-100 text-emerald-700"
    case "ANNOUNCEMENT_POSTED": return "bg-amber-100 text-amber-700"
    default: return "bg-slate-100 text-slate-700"
  }
}

export default async function ParentStudentProfilePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const studentId = params.id
  
  const [profile, timeline] = await Promise.all([
    getStudentProfile(studentId).catch(() => null),
    getStudentTimeline(studentId).catch(() => [])
  ])

  if (!profile) {
    notFound()
  }

  const activeEnrollment = profile.enrollments?.[0]
  const batch = activeEnrollment?.batch
  const academicYear = batch?.academicYear

  const totalAtt = profile.attendance.length
  const presentAtt = profile.attendance.filter(a => a.status === "PRESENT" || a.status === "LATE").length
  const absentAtt = profile.attendance.filter(a => a.status === "ABSENT").length
  const attRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Profile Card */}
      <Card className="border-none shadow-sm bg-gradient-to-br from-violet-600 to-indigo-700 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <GraduationCap className="w-64 h-64 -mt-12 -mr-12" />
        </div>
        <CardContent className="p-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="h-24 w-24 rounded-full bg-white/20 flex items-center justify-center text-4xl font-bold backdrop-blur-sm border-4 border-white/30 flex-shrink-0">
              {profile.name.charAt(0)}
            </div>
            <div className="text-center md:text-left flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <h1 className="text-3xl font-bold">{profile.name}</h1>
                <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm w-max mx-auto md:mx-0">
                  {batch ? \`Class \${batch.grade}\${batch.section ? \` \${batch.section}\` : ""}\` : \`Class \${profile.class}\`}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 text-indigo-100 text-sm">
                <div>
                  <p className="text-indigo-300 text-xs uppercase tracking-wider font-medium mb-1">Roll Number</p>
                  <p className="font-medium">{profile.rollNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-indigo-300 text-xs uppercase tracking-wider font-medium mb-1">Academic Year</p>
                  <p className="font-medium">{academicYear?.name || "Current"}</p>
                </div>
                <div>
                  <p className="text-indigo-300 text-xs uppercase tracking-wider font-medium mb-1">Gender</p>
                  <p className="font-medium">{profile.gender || "N/A"}</p>
                </div>
                <div>
                  <p className="text-indigo-300 text-xs uppercase tracking-wider font-medium mb-1">Date of Birth</p>
                  <p className="font-medium">
                    {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString("en-IN") : "N/A"}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 min-w-[140px]">
              <Button variant="secondary" className="w-full bg-white text-indigo-700 hover:bg-indigo-50 border-none shadow-sm">
                <Download className="w-4 h-4 mr-2" />
                ID Card
              </Button>
              <Button variant="outline" className="w-full text-white border-white/30 hover:bg-white/10 hover:text-white">
                <Download className="w-4 h-4 mr-2" />
                Report Card
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Stats & Summaries */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Attendance Stat */}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Attendance</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{attRate}%</h3>
                  </div>
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 flex gap-4 text-sm">
                  <span className="flex items-center text-emerald-600">
                    <CheckCircle className="h-4 w-4 mr-1" /> {presentAtt}
                  </span>
                  <span className="flex items-center text-red-500">
                    <XCircle className="h-4 w-4 mr-1" /> {absentAtt}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Fees Stat */}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Fees Paid</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      ₹{profile.paidAmount.toLocaleString("en-IN")}
                    </h3>
                  </div>
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg">
                    <IndianRupee className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <Badge variant="outline" className={cn("text-xs font-normal", feeStatusColor(profile.feeStatus))}>
                    {profile.feeStatus}
                  </Badge>
                  {profile.pendingAmount > 0 && (
                    <span className="text-xs text-red-500 ml-2 font-medium">₹{profile.pendingAmount.toLocaleString()} pending</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Parent Info */}
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Primary Parent</p>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate max-w-[120px]">
                      {profile.parent?.name || "N/A"}
                    </h3>
                  </div>
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-lg">
                    <User className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 text-sm text-slate-500">
                  {profile.parent?.relationship || "Guardian"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Deep dive sections can go here in future (e.g. detailed charts) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">About {profile.name.split(" ")[0]}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-sm leading-relaxed">
                {profile.name} is currently enrolled in {batch ? \`Class \${batch.grade}\${batch.section ? \` \${batch.section}\` : ""}\` : \`Class \${profile.class}\`} 
                for the {academicYear?.name || "current"} academic session. 
                With an attendance rate of {attRate}%, {profile.name.split(" ")[0]} is maintaining a 
                {attRate >= 75 ? " good" : " concerning"} attendance record.
              </p>
              
              <div className="mt-6 flex gap-3">
                 <Link href="/parent/attendance">
                    <Button variant="outline" size="sm">View Full Attendance</Button>
                 </Link>
                 <Link href="/parent/results">
                    <Button variant="outline" size="sm">View All Results</Button>
                 </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Timeline */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest updates for {profile.name.split(" ")[0]}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {timeline.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-sm">No recent activity</p>
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-800 space-y-6">
                  {timeline.map((event, i) => (
                    <div key={event.id} className="relative">
                      <div className={cn(
                        "absolute -left-[35px] h-8 w-8 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-950",
                        getTimelineColor(event.type)
                      )}>
                        {getTimelineIcon(event.type)}
                      </div>
                      <div className="pt-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {event.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(event.date).toLocaleDateString("en-IN", {
                            month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
`
fs.writeFileSync("app/(parent-portal)/parent/students/[id]/page.tsx", correctPage);

// 3. Fix parent-portal.ts DAL syntax
let dal = fs.readFileSync("lib/dal/parent-portal.ts", "utf-8");
dal = dal.replace(/export async function getChildResults\\(studentId: string\\) \\{[\\s\\S]*?\\}\\n\\n\\n\\n/, '');
// It had an extra } or trailing parenthesis
dal = dal.replace(/},\r?\n\s+\)\r?\n\s+}\)\r?\n}/, '    )\n  })\n}');
dal = dal.replace(/},\n\s+\)\n\s+}\)\n}/, '    )\n  })\n}');
// Let's just rewrite the end part correctly
const childResultsStr = `export async function getChildResults(studentId: string) {
  return withTenantRead(async () => {
    const { schoolId, parentId } = await getParentContext()
    await assertChildOwnership(studentId, schoolId, parentId)
    return withDAL(
      "parentPortal.childResults",
      () =>
        prisma.result.findMany({
          where: { studentId, schoolId },
          orderBy: { createdAt: "desc" },
          include: {
            exam: { select: { name: true, subject: true, date: true, examGroup: { select: { name: true, term: true, academicYear: { select: { name: true } } } } } },
          },
        }),
      { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
    )
  })
}`;

// I will just read DAL, strip anything after getChildInvoices, and rewrite getSchoolAnnouncements, getStudentProfile, getStudentTimeline, getChildResults
fs.writeFileSync("lib/dal/parent-portal.ts", 
\`import { withTenantRead } from "@/lib/dal/core"
/**
 * Parent Portal DAL
 */
import { prisma } from "@/lib/prisma"
import { withDAL } from "@/lib/dal/utils"
import { getParentContext } from "@/lib/tenant-context"
import { logger } from "@/lib/logger"
import { THRESHOLDS } from "@/lib/observability/performance"

const log = logger.child({ domain: "parent-portal" })

export async function getParentDashboard() {
  return withTenantRead(async () => {
    const { schoolId, parentId } = await getParentContext()
  return withDAL(
    "parentPortal.dashboard",
    () =>
      prisma.parent.findUnique({
        where: { id: parentId },
        include: {
          students: {
            where: { schoolId, isActive: true },
            select: {
              id: true,
              name: true,
              class: true,
              section: true,
              rollNumber: true,
              feeStatus: true,
              totalFees: true,
              paidAmount: true,
              pendingAmount: true,
              avatar: true,
              attendance: {
                where: { schoolId },
                orderBy: { date: "desc" },
                take: 30,
                select: { date: true, status: true },
              },
              results: {
                where: { schoolId },
                orderBy: { createdAt: "desc" },
                take: 5,
                select: { grade: true, marks: true, createdAt: true, exam: { select: { name: true, maxMarks: true } } },
              },
              payments: {
                where: { schoolId },
                orderBy: { date: "desc" },
                take: 5,
                select: { amount: true, feeType: true, date: true, status: true, receiptNumber: true },
              },
            },
          },
        },
      }),
    { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
  )
  })
}

async function assertChildOwnership(studentId: string, schoolId: string, parentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { schoolId: true, parentId: true },
  })
  if (!student || student.schoolId !== schoolId || student.parentId !== parentId) {
    throw new Error("Student not found or not linked to this parent")
  }
}

export async function getChildAttendance(studentId: string, opts?: { limit?: number }) {
  return withTenantRead(async () => {
    const { schoolId, parentId } = await getParentContext()
  await assertChildOwnership(studentId, schoolId, parentId)
  const { limit = 60 } = opts ?? {}
  return withDAL(
    "parentPortal.childAttendance",
    () =>
      prisma.attendance.findMany({
        where: { studentId, schoolId },
        orderBy: { date: "desc" },
        take: limit,
        select: { date: true, status: true, remarks: true },
      }),
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
  })
}

export async function getChildPayments(studentId: string) {
  return withTenantRead(async () => {
    const { schoolId, parentId } = await getParentContext()
  await assertChildOwnership(studentId, schoolId, parentId)
  return withDAL(
    "parentPortal.childPayments",
    () =>
      prisma.payment.findMany({
        where: { studentId, schoolId },
        orderBy: { date: "desc" },
        select: { id: true, amount: true, feeType: true, paymentMethod: true, date: true, status: true, receiptNumber: true, remarks: true },
      }),
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
  })
}

export async function getChildInvoices(studentId: string) {
  return withTenantRead(async () => {
    const { schoolId, parentId } = await getParentContext()
  await assertChildOwnership(studentId, schoolId, parentId)
  return withDAL(
    "parentPortal.childInvoices",
    () =>
      prisma.invoice.findMany({
        where: { studentId, schoolId },
        orderBy: { createdAt: "desc" },
        select: { id: true, invoiceNo: true, lineItems: true, subtotal: true, cgstRate: true, cgstAmount: true, sgstRate: true, sgstAmount: true, igstRate: true, igstAmount: true, discountAmount: true, discountReason: true, total: true, dueDate: true, paidAt: true, status: true, notes: true, createdAt: true },
      }),
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
  })
}

export async function getSchoolAnnouncements() {
  return withTenantRead(async () => {
    const { schoolId } = await getParentContext()
  return withDAL(
    "parentPortal.announcements",
    () =>
      prisma.announcement.findMany({
        where: { schoolId, isActive: true, targetAudience: { in: ["ALL", "PARENTS"] } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    { log, thresholdMs: THRESHOLDS.DB_SIMPLE_QUERY },
  )
  })
}

export async function getStudentProfile(studentId: string) {
  return withTenantRead(async () => {
    const { schoolId, parentId } = await getParentContext()
    await assertChildOwnership(studentId, schoolId, parentId)

    return withDAL(
      "parentPortal.studentProfile",
      () =>
        prisma.student.findUnique({
          where: { id: studentId },
          select: {
            id: true,
            name: true,
            class: true,
            section: true,
            rollNumber: true,
            gender: true,
            dateOfBirth: true,
            avatar: true,
            feeStatus: true,
            totalFees: true,
            paidAmount: true,
            pendingAmount: true,
            parent: {
              select: { id: true, name: true, relationship: true }
            },
            enrollments: {
              where: { isActive: true },
              include: { batch: { include: { academicYear: true } } }
            },
            attendance: {
              where: { schoolId },
              orderBy: { date: "desc" },
              take: 30,
              select: { status: true, date: true }
            }
          },
        }),
      { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY },
    )
  })
}

export async function getStudentTimeline(studentId: string) {
  return withTenantRead(async () => {
    const { schoolId, parentId } = await getParentContext()
    await assertChildOwnership(studentId, schoolId, parentId)

    return withDAL(
      "parentPortal.studentTimeline",
      async () => {
        const [attendance, results, payments, announcements] = await Promise.all([
          prisma.attendance.findMany({
            where: { studentId, schoolId },
            orderBy: { date: "desc" },
            take: 20,
            select: { date: true, status: true, id: true }
          }),
          prisma.result.findMany({
            where: { studentId, schoolId },
            orderBy: { createdAt: "desc" },
            take: 10,
            select: { createdAt: true, grade: true, id: true, exam: { select: { name: true } } }
          }),
          prisma.payment.findMany({
            where: { studentId, schoolId },
            orderBy: { date: "desc" },
            take: 10,
            select: { date: true, amount: true, feeType: true, id: true }
          }),
          prisma.announcement.findMany({
            where: { schoolId, isActive: true, targetAudience: { in: ["ALL", "PARENTS"] } },
            orderBy: { createdAt: "desc" },
            take: 10,
            select: { createdAt: true, title: true, id: true }
          })
        ]);

        const timeline: any[] = [];
        
        attendance.forEach(a => timeline.push({
          id: \`att-\${a.id}\`,
          type: "ATTENDANCE_MARKED",
          date: a.date,
          title: \`Attendance Marked: \${a.status}\`,
          meta: { status: a.status }
        }));

        results.forEach(r => timeline.push({
          id: \`res-\${r.id}\`,
          type: "RESULT_PUBLISHED",
          date: r.createdAt,
          title: \`Result Published: \${r.exam.name}\`,
          meta: { grade: r.grade }
        }));

        payments.forEach(p => timeline.push({
          id: \`pay-\${p.id}\`,
          type: "PAYMENT_RECEIVED",
          date: p.date,
          title: \`Payment Received: ₹\${p.amount}\`,
          meta: { amount: p.amount, feeType: p.feeType }
        }));

        announcements.forEach(a => timeline.push({
          id: \`ann-\${a.id}\`,
          type: "ANNOUNCEMENT_POSTED",
          date: a.createdAt,
          title: a.title,
          meta: {}
        }));

        timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return timeline.slice(0, 50);
      },
      { log, thresholdMs: THRESHOLDS.DB_COMPLEX_QUERY }
    )
  })
}

${childResultsStr}
\`);
