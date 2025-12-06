// Mock data for development - replace with actual database calls later

export const mockStudents = [
  {
    id: "1",
    name: "John Doe",
    email: "john@school.com",
    class: "10A",
    feeStatus: "Paid",
    totalFees: 5000,
    paidAmount: 5000,
    pendingAmount: 0,
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@school.com",
    class: "10B",
    feeStatus: "Pending",
    totalFees: 5000,
    paidAmount: 2500,
    pendingAmount: 2500,
  },
  {
    id: "3",
    name: "Bob Johnson",
    email: "bob@school.com",
    class: "10A",
    feeStatus: "Overdue",
    totalFees: 5000,
    paidAmount: 0,
    pendingAmount: 5000,
  },
  {
    id: "4",
    name: "Alice Williams",
    email: "alice@school.com",
    class: "11B",
    feeStatus: "Paid",
    totalFees: 5500,
    paidAmount: 5500,
    pendingAmount: 0,
  },
  {
    id: "5",
    name: "Charlie Brown",
    email: "charlie@school.com",
    class: "11A",
    feeStatus: "Pending",
    totalFees: 5500,
    paidAmount: 3000,
    pendingAmount: 2500,
  },
  {
    id: "6",
    name: "Diana Prince",
    email: "diana@school.com",
    class: "12A",
    feeStatus: "Paid",
    totalFees: 6000,
    paidAmount: 6000,
    pendingAmount: 0,
  },
]

export const mockTeachers = [
  {
    id: "1",
    name: "Mr. Anderson",
    email: "anderson@school.com",
    subject: "Mathematics",
    class: "10A",
    phone: "+1234567890",
  },
  {
    id: "2",
    name: "Ms. Wilson",
    email: "wilson@school.com",
    subject: "English",
    class: "10B",
    phone: "+1234567891",
  },
  {
    id: "3",
    name: "Dr. Martinez",
    email: "martinez@school.com",
    subject: "Science",
    class: "11A",
    phone: "+1234567892",
  },
  {
    id: "4",
    name: "Ms. Taylor",
    email: "taylor@school.com",
    subject: "History",
    class: "11B",
    phone: "+1234567893",
  },
  {
    id: "5",
    name: "Mr. Lee",
    email: "lee@school.com",
    subject: "Physical Education",
    class: "12A",
    phone: "+1234567894",
  },
]

export const mockParents = [
  {
    id: "1",
    name: "Mr. & Mrs. Doe",
    email: "parents.doe@email.com",
    phone: "+1234567890",
    studentName: "John Doe",
    relationship: "Father/Mother",
  },
  {
    id: "2",
    name: "Mr. Smith",
    email: "smith@email.com",
    phone: "+1234567891",
    studentName: "Jane Smith",
    relationship: "Father",
  },
  {
    id: "3",
    name: "Ms. Johnson",
    email: "johnson@email.com",
    phone: "+1234567892",
    studentName: "Bob Johnson",
    relationship: "Mother",
  },
  {
    id: "4",
    name: "Mr. & Mrs. Williams",
    email: "williams@email.com",
    phone: "+1234567893",
    studentName: "Alice Williams",
    relationship: "Father/Mother",
  },
]

export const mockClasses = [
  { id: "1", name: "10A", section: "A", strength: 35, classTeacher: "Mr. Anderson" },
  { id: "2", name: "10B", section: "B", strength: 32, classTeacher: "Ms. Wilson" },
  { id: "3", name: "11A", section: "A", strength: 38, classTeacher: "Dr. Martinez" },
  { id: "4", name: "11B", section: "B", strength: 36, classTeacher: "Ms. Taylor" },
  { id: "5", name: "12A", section: "A", strength: 40, classTeacher: "Mr. Lee" },
  { id: "6", name: "12B", section: "B", strength: 33, classTeacher: "Mr. Anderson" },
]

export const mockFees = [
  { id: "1", type: "Tuition", amount: 3000, description: "Regular tuition fees" },
  { id: "2", type: "Lab", amount: 500, description: "Laboratory and science equipment" },
  { id: "3", type: "Sports", amount: 300, description: "Sports and games activities" },
  { id: "4", type: "Transport", amount: 800, description: "School bus transportation" },
  { id: "5", type: "Technology", amount: 400, description: "IT and computer lab access" },
  { id: "6", type: "Development", amount: 500, description: "School development charges" },
]

export const mockPayments = [
  {
    id: "1",
    studentName: "John Doe",
    amount: 5000,
    date: "2024-11-15",
    method: "Bank Transfer",
    status: "Completed",
  },
  {
    id: "2",
    studentName: "Jane Smith",
    amount: 2500,
    date: "2024-11-10",
    method: "Credit Card",
    status: "Completed",
  },
  {
    id: "3",
    studentName: "Alice Williams",
    amount: 5500,
    date: "2024-11-05",
    method: "Cheque",
    status: "Completed",
  },
  {
    id: "4",
    studentName: "Charlie Brown",
    amount: 3000,
    date: "2024-10-28",
    method: "Online Payment",
    status: "Completed",
  },
  {
    id: "5",
    studentName: "Diana Prince",
    amount: 6000,
    date: "2024-10-20",
    method: "Bank Transfer",
    status: "Completed",
  },
]

export const mockAttendance = [
  { date: "2024-11-20", present: 180, absent: 20, totalStudents: 200 },
  { date: "2024-11-19", present: 185, absent: 15, totalStudents: 200 },
  { date: "2024-11-18", present: 178, absent: 22, totalStudents: 200 },
  { date: "2024-11-17", present: 190, absent: 10, totalStudents: 200 },
  { date: "2024-11-16", present: 188, absent: 12, totalStudents: 200 },
  { date: "2024-11-15", present: 192, absent: 8, totalStudents: 200 },
]

export const mockFinanceData = [
  { month: "Jan", collected: 85000, pending: 15000 },
  { month: "Feb", collected: 92000, pending: 8000 },
  { month: "Mar", collected: 88000, pending: 12000 },
  { month: "Apr", collected: 95000, pending: 5000 },
  { month: "May", collected: 98000, pending: 2000 },
  { month: "Jun", collected: 100000, pending: 0 },
]

export const mockDashboardStats = {
  totalStudents: 1234,
  totalTeachers: 123,
  totalParents: 1089,
  totalStaff: 45,
  totalCollected: 245890,
  pendingPayments: 45230,
  overdueFeesCount: 34,
  collectionRate: 87.5,
}
