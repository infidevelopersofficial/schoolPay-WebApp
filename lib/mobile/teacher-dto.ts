export interface TeacherClassDTO {
  id: string;
  name: string;
  section: string;
  grade?: string | null;
  subjectFocus?: string | null;
  capacity: number;
  studentCount: number;
  isClassTeacher: boolean;
}

export interface TeacherStudentDTO {
  id: string;
  name: string;
  rollNumber: string | null;
  avatar: string | null;
  attendanceRate?: number;
}

export interface TeacherDashboardDTO {
  classes: number;
  students: number;
  attendancePending: number;
  assignmentsPending: number;
  upcomingExams: any[]; // simplified for now
  recentAnnouncements: any[];
}

export interface AttendanceSheetDTO {
  batchId: string;
  batchName: string;
  date: string;
  students: {
    studentId: string;
    name: string;
    status?: string | null;
  }[];
}

export interface AssignmentDTO {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  subjectId: string;
  batchId: string;
}

export interface TeacherResultDTO {
  id: string;
  studentId: string;
  examId: string;
  marks: number | null;
  grade: string | null;
  status: string;
}

export interface TeacherAnnouncementDTO {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: string;
  category: string;
}
