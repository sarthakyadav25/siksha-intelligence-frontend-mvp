// ── Attendance DTOs ──────────────────────────────────────────────────

// Attendance Types
export interface AttendanceTypeRequestDTO {
  typeName: string;
  shortCode: string;
  isPresentMark: boolean;
  isAbsenceMark: boolean;
  isLateMark: boolean;
  colorCode?: string;
}

export interface AttendanceTypeResponseDTO {
  id: number;
  uuid: string;
  typeName: string;
  shortCode: string;
  colorCode?: string;
  presentMark: boolean;
  absenceMark: boolean;
  lateMark: boolean;
}

// Student Attendance
export interface StudentAttendanceRequestDTO {
  studentId?: number;
  studentUuid?: string;
  attendanceShortCode: string;
  attendanceDate: string;
  takenByStaffId?: number;
  takenByStaffUuid?: string;
  notes?: string;
}

export interface AbsenceDocumentationSummaryResponseDTO {
  dailyAttendanceId: number;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  documentationUrl?: string;
}

export interface StudentAttendanceResponseDTO {
  dailyAttendanceId: number;
  uuid: string;
  studentId: number;
  studentFullName: string;
  attendanceDate: string;
  attendanceTypeShortCode: string;
  takenByStaffId: number;
  takenByStaffName: string;
  attendanceType: AttendanceTypeResponseDTO;
  notes?: string;
  absenceDocumentation?: AbsenceDocumentationSummaryResponseDTO;
  createdAt: string;
  createdBy: string;
}

// Student Attendance Query Params
export interface StudentAttendanceQueryParams {
  page?: number;
  size?: number;
  sort?: string;
  studentId?: number;
  takenByStaffId?: number;
  fromDate?: string;
  toDate?: string;
  attendanceTypeShortCode?: string;
}

// Staff Attendance
export type AttendanceSource = "MANUAL" | "BIOMETRIC" | "SYSTEM";

export interface StaffAttendanceRequestDTO {
  staffId: number;
  attendanceDate: string;
  attendanceShortCode: string;
  timeIn?: string;
  timeOut?: string;
  totalHours?: number;
  source: AttendanceSource;
  notes?: string;
}

export interface StaffAttendanceResponseDTO {
  staffAttendanceId: number;
  staffId: number;
  staffName: string;
  jobTitle?: string;
  attendanceDate: string;
  attendanceMark: string;
  shortCode: string;
  colorCode?: string;
  timeIn?: string;
  timeOut?: string;
  totalHours?: number;
  source: AttendanceSource;
  notes?: string;
}

export interface StaffAttendanceQueryParams {
  page?: number;
  size?: number;
  sort?: string;
  staffId?: number;
  date?: string;
}

// Absence Documentation
export interface SubmitExcuseRequestDTO {
  attendanceId: number;
  submittedByParentId: number;
  documentUrl?: string;
  note?: string;
  attendanceDate?: string;
}

export interface AbsenceDocumentationResponseDTO {
  dailyAttendanceId: number;
  uuid: string;
  reasonText?: string;
  documentationUrl?: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  reviewerNotes?: string;
  submittedByUserId: number;
  submittedByUserName: string;
  approvedByStaffId?: number;
  approvedByStaffName?: string;
  createdAt: string;
}
