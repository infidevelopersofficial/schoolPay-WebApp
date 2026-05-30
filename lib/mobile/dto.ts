export interface StudentDTO {
  id: string;
  name: string;
  avatar: string | null;
  class: string;
  section: string | null;
  admissionNumber: string | null;
  rollNumber: string | null;
}

export interface AttendanceDTO {
  id: string;
  date: string;
  status: string;
  remarks: string | null;
}

export interface InvoiceDTO {
  id: string;
  invoiceNo: string;
  title: string | null;
  total: number;
  dueDate: string;
  status: string;
  paidAt: string | null;
  studentId: string;
}

export interface PaymentDTO {
  id: string;
  amount: number;
  feeType: string;
  status: string;
  date: string;
  paymentMethod: string;
  receiptNumber: string | null;
  studentId: string;
}

export interface NotificationDTO {
  id: string;
  title: string;
  content: string;
  category: string;
  status: string;
  readAt: string | null;
  createdAt: string;
  entityId: string | null;
  eventType: string;
}

export interface AnnouncementDTO {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  publishedAt: string | null;
  authorName: string;
}

export interface SurveyDTO {
  id: string;
  title: string;
  description: string | null;
  status: string;
  expiresAt: string | null;
  createdAt: string;
}

export interface ExamResultDTO {
  id: string;
  examName: string;
  subject: string;
  date: string;
  maxMarks: number;
  marksObtained: number | null;
  grade: string | null;
  status: string;
  remarks: string | null;
}
