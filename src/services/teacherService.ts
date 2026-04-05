import { api } from "@/lib/axios";

// ── Teacher Service ──────────────────────────────────────────────────

export const teacherService = {
  // ── Live APIs ─────────────────────────────────────────────────────

  /** GET /auth/me — verify session & get teacher profile */
  getMe() {
    return api.get("/auth/me");
  },

  /** GET /api/v2/ams/roster/{classId}?date=YYYY-MM-DD — daily roster for swipe */
  getRoster(classId: string, date: string) {
    return api.get(`/ams/roster/${classId}`, { params: { date } });
  },

  /** POST /api/v2/ams/batch — submit swipe session records */
  submitAttendanceBatch(records: AttendanceRecord[]) {
    return api.post("/ams/batch", records);
  },

  /** GET /api/v2/teacher/dashboard/pulse-chart/{classId} */
  getPulseChart(classId: string) {
    return api.get(`/teacher/dashboard/pulse-chart/${classId}`);
  },

  /** GET /api/v2/teacher/dashboard/at-risk/{classId} */
  getAtRiskStudents(classId: string) {
    return api.get(`/teacher/dashboard/at-risk/${classId}`);
  },

  /** GET /api/v2/teacher/dashboard/heatmap/{classId} */
  getHeatmap(classId: string) {
    return api.get(`/teacher/dashboard/heatmap/${classId}`);
  },

  /** GET /api/v1/teacher/schedule/{staffId} */
  getSchedule(staffId: string) {
    return api.get(`/teacher/schedule/${staffId}`);
  },
};

// ── Types ────────────────────────────────────────────────────────────

export interface AttendanceRecord {
  studentId: string;
  status: "PRESENT" | "ABSENT" | "LATE";
  date: string;
  classId: string;
  markedBy: string;
}

export interface ScheduleEntry {
  id: string;
  time: string;
  endTime: string;
  subject: string;
  room: string;
  className: string;
  section: string;
  isNext?: boolean;
}

export interface StudentCard {
  studentId: string;
  name: string;
  rollNumber: string;
  profileUrl?: string;
  section: string;
  parentName?: string;
  parentPhone?: string;
  attendancePercentage?: number;
  absenceCount?: number;
}

// ── Mock Data (for features without backend yet) ─────────────────────

export const MOCK_SCHEDULE: ScheduleEntry[] = [
  { id: "1", time: "08:00", endTime: "08:45", subject: "Mathematics", room: "Room 201", className: "Class 10", section: "A" },
  { id: "2", time: "08:50", endTime: "09:35", subject: "Physics", room: "Room 305", className: "Class 10", section: "B" },
  { id: "3", time: "09:40", endTime: "10:25", subject: "Mathematics", room: "Room 201", className: "Class 9", section: "A" },
  { id: "4", time: "10:45", endTime: "11:30", subject: "Chemistry", room: "Lab 2", className: "Class 10", section: "A" },
  { id: "5", time: "11:35", endTime: "12:20", subject: "Mathematics", room: "Room 201", className: "Class 8", section: "C" },
  { id: "6", time: "13:00", endTime: "13:45", subject: "Physics", room: "Room 305", className: "Class 9", section: "B" },
];

export const MOCK_STUDENTS: StudentCard[] = [
  { studentId: "S001", name: "Aarav Sharma", rollNumber: "01", profileUrl: "", section: "A", parentName: "Rajesh Sharma", parentPhone: "+91 98765 43210", attendancePercentage: 94, absenceCount: 2 },
  { studentId: "S002", name: "Priya Patel", rollNumber: "02", profileUrl: "", section: "A", parentName: "Meena Patel", parentPhone: "+91 98765 43211", attendancePercentage: 88, absenceCount: 4 },
  { studentId: "S003", name: "Rohan Singh", rollNumber: "03", profileUrl: "", section: "A", parentName: "Harpreet Singh", parentPhone: "+91 98765 43212", attendancePercentage: 72, absenceCount: 8 },
  { studentId: "S004", name: "Ananya Gupta", rollNumber: "04", profileUrl: "", section: "A", parentName: "Sanjay Gupta", parentPhone: "+91 98765 43213", attendancePercentage: 96, absenceCount: 1 },
  { studentId: "S005", name: "Arjun Kumar", rollNumber: "05", profileUrl: "", section: "A", parentName: "Vijay Kumar", parentPhone: "+91 98765 43214", attendancePercentage: 81, absenceCount: 6 },
  { studentId: "S006", name: "Kavya Reddy", rollNumber: "06", profileUrl: "", section: "A", parentName: "Suresh Reddy", parentPhone: "+91 98765 43215", attendancePercentage: 91, absenceCount: 3 },
  { studentId: "S007", name: "Vikram Joshi", rollNumber: "07", profileUrl: "", section: "A", parentName: "Anil Joshi", parentPhone: "+91 98765 43216", attendancePercentage: 67, absenceCount: 10 },
  { studentId: "S008", name: "Nisha Verma", rollNumber: "08", profileUrl: "", section: "A", parentName: "Ravi Verma", parentPhone: "+91 98765 43217", attendancePercentage: 95, absenceCount: 2 },
  { studentId: "S009", name: "Aditya Rao", rollNumber: "09", profileUrl: "", section: "A", parentName: "Krishna Rao", parentPhone: "+91 98765 43218", attendancePercentage: 78, absenceCount: 7 },
  { studentId: "S010", name: "Sneha Nair", rollNumber: "10", profileUrl: "", section: "A", parentName: "Prakash Nair", parentPhone: "+91 98765 43219", attendancePercentage: 99, absenceCount: 0 },
];

export const MOCK_PULSE_CHART = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  return {
    date: date.toISOString().split("T")[0],
    label: `${date.getDate()}/${date.getMonth() + 1}`,
    present: isWeekend ? 0 : Math.floor(Math.random() * 8 + 32),
    absent: isWeekend ? 0 : Math.floor(Math.random() * 5 + 1),
    total: isWeekend ? 0 : 40,
  };
});

export const MOCK_HEATMAP = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  return {
    date: date.toISOString().split("T")[0],
    day: date.toLocaleDateString("en-US", { weekday: "short" }),
    dayNum: date.getDate(),
    absences: isWeekend ? -1 : Math.floor(Math.random() * 8),
  };
});

export const MOCK_CHAT_HISTORY = [
  { id: 1, sender: "teacher", message: "Hello, I wanted to discuss your ward's attendance irregularity.", time: "10:30 AM" },
  { id: 2, sender: "guardian", message: "Thank you for reaching out. Is there a concern?", time: "10:35 AM" },
  { id: 3, sender: "teacher", message: "Yes, they have been absent 4 times in the last 2 weeks. Is everything okay?", time: "10:36 AM" },
  { id: 4, sender: "guardian", message: "They were unwell last week. I have the medical certificate. Will send it tomorrow.", time: "10:40 AM" },
  { id: 5, sender: "teacher", message: "That's fine. Please submit it to the admin office. Thank you.", time: "10:42 AM" },
];
