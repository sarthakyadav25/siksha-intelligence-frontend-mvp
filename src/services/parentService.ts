import type { ChildSummary, ParentDashboardData } from "./types/parent";

// ── Parent / Guardian Portal — Mock Service ──────────────────────────

const PAUSE = (ms: number) => new Promise(res => setTimeout(res, ms));

const MOCK_CHILDREN: ChildSummary[] = [
  {
    childId: "child-1",
    firstName: "Aarav",
    lastName: "Sharma",
    fullName: "Aarav Sharma",
    className: "Class 10",
    section: "A",
    rollNumber: "10",
    profileUrl: "https://i.pravatar.cc/150?u=aarav",
  },
  {
    childId: "child-2",
    firstName: "Diya",
    lastName: "Sharma",
    fullName: "Diya Sharma",
    className: "Class 8",
    section: "B",
    rollNumber: "15",
    profileUrl: "https://i.pravatar.cc/150?u=diya",
  }
];

const generateDashboardData = (childId: string): ParentDashboardData => {
  const child = MOCK_CHILDREN.find(c => c.childId === childId) || MOCK_CHILDREN[0];
  
  return {
    child,
    attendance: {
      totalDays: 120,
      presentDays: 105,
      absentDays: 10,
      lateDays: 5,
      attendancePercentage: 87.5,
      todayStatus: "PRESENT",
      monthlyBreakdown: [
        { month: "Jan", present: 20, absent: 2, late: 0 },
        { month: "Feb", present: 19, absent: 1, late: 0 },
        { month: "Mar", present: 21, absent: 0, late: 2 },
      ]
    },
    performance: {
      currentGpa: 8.5,
      maxGpa: 10,
      classAverage: 7.2,
      rank: 5,
      totalStudents: 40,
      trend: [
        { exam: "Unit 1", gpa: 8.0, classAvg: 7.0 },
        { exam: "Mid Term", gpa: 8.2, classAvg: 7.1 },
        { exam: "Unit 2", gpa: 8.5, classAvg: 7.2 },
      ],
      subjects: [
        { subject: "Mathematics", marks: 85, maxMarks: 100, grade: "A2", teacherRemarks: "Good progress" },
        { subject: "Science", marks: 92, maxMarks: 100, grade: "A1", teacherRemarks: "Excellent" },
        { subject: "English", marks: 78, maxMarks: 100, grade: "B1", teacherRemarks: "Can do better" },
      ]
    },
    feesDue: {
      totalDue: 15000,
      currency: "INR",
      nextDueDate: "2026-05-15",
      feeBreakdown: [
        { feeType: "Tuition Fee (Q1)", amount: 12000, dueDate: "2026-05-15", status: "PENDING" },
        { feeType: "Transport Fee", amount: 3000, dueDate: "2026-05-15", status: "PENDING" },
      ],
      recentPayments: [
        { paymentId: "PAY101", amount: 15000, date: "2026-04-10", method: "Online", receiptUrl: "#" }
      ]
    },
    homeworkPending: {
      totalPending: 2,
      totalSubmitted: 15,
      totalOverdue: 0,
      assignments: [
        {
          assignmentId: "hw-1",
          subject: "Mathematics",
          title: "Algebra Worksheet",
          description: "Complete exercises 1 to 10 on page 45.",
          dueDate: "2026-04-12T23:59:00Z",
          status: "PENDING",
          teacherName: "Mr. Gupta",
          seenByParent: false
        },
        {
          assignmentId: "hw-2",
          subject: "Science",
          title: "Physics Lab Report",
          description: "Submit the report for the pendulum experiment.",
          dueDate: "2026-04-15T23:59:00Z",
          status: "PENDING",
          teacherName: "Ms. Verma",
          seenByParent: true
        }
      ]
    },
    recentNotifications: [
      {
        notificationId: "notif-1",
        title: "Upcoming Parent-Teacher Meeting",
        message: "PTM is scheduled for this Saturday at 10 AM.",
        category: "EVENT",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        isRead: false
      },
      {
        notificationId: "notif-2",
        title: "Fee Reminder",
        message: "Quarter 1 fees are due next month.",
        category: "FEES",
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        isRead: true
      }
    ]
  };
};

export const parentService = {
  /** GET /parent/children */
  async getMyChildren() {
    await PAUSE(400); // Simulate network latency
    return { data: MOCK_CHILDREN };
  },

  /** GET /parent/dashboard?childId= */
  async getDashboardSummary(childId: string) {
    await PAUSE(600);
    return { data: generateDashboardData(childId) };
  },

  /** GET /parent/academics?childId= */
  async getAcademics(childId: string) {
    await PAUSE(500);
    return { data: generateDashboardData(childId).performance };
  },

  /** GET /parent/attendance?childId= */
  async getAttendance(childId: string) {
    await PAUSE(400);
    return { data: generateDashboardData(childId).attendance };
  },

  /** GET /parent/homework?childId= */
  async getHomework(childId: string) {
    await PAUSE(500);
    return { data: generateDashboardData(childId).homeworkPending };
  },

  /** GET /parent/fees?childId= */
  async getFees(childId: string) {
    await PAUSE(600);
    return { data: generateDashboardData(childId).feesDue };
  }
};
