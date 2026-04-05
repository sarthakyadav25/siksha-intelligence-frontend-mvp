import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { teacherService } from "@/services/teacherService";
import type { StudentCard, ScheduleEntry } from "@/services/teacherService";
import { attendanceService } from "@/services/attendance";
import type { StudentAttendanceRequestDTO } from "@/services/types/attendance";

export interface TeacherProfileBasic {
  bio: string;
  phone: string;
  address: string;
}

export interface AttendanceEntry {
  studentId: string;
  status: "PRESENT" | "ABSENT" | "LATE" | null;
}

export interface TeacherState {
  /** Editable basic profile fields (mock — no backend yet) */
  basicProfile: TeacherProfileBasic;
  /** Current attendance session tracking */
  attendanceSession: {
    entries: AttendanceEntry[];
    currentIndex: number;
    submitted: boolean;
    isFirstLecture: boolean;
    classId: string | null;
  };
  /** Notification count for UI badge */
  notificationCount: number;
  schedule: ScheduleEntry[];
  currentRoster: StudentCard[];
  loading: boolean;
  error: string | null;
}

const initialState: TeacherState = {
  basicProfile: {
    bio: "Passionate educator with 10+ years of experience in Mathematics and Physics.",
    phone: "+91 98765 43210",
    address: "42, Koramangala, Bangalore, Karnataka 560034",
  },
  attendanceSession: {
    entries: [],
    currentIndex: 0,
    submitted: false,
    isFirstLecture: true,
    classId: null,
  },
  notificationCount: 3,
  schedule: [],
  currentRoster: [],
  loading: false,
  error: null,
};

export const fetchTeacherSchedule = createAsyncThunk(
  "teacher/fetchSchedule",
  async (staffId: string, { rejectWithValue }) => {
    try {
      const response = await teacherService.getSchedule(staffId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch schedule");
    }
  }
);

export const fetchClassRoster = createAsyncThunk(
  "teacher/fetchRoster",
  async ({ classId, date }: { classId: string; date: string }, { rejectWithValue }) => {
    try {
      const response = await teacherService.getRoster(classId, date);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch roster");
    }
  }
);

export const submitAttendance = createAsyncThunk(
  "teacher/submitAttendance",
  async (records: StudentAttendanceRequestDTO[], { rejectWithValue }) => {
    try {
      // Using attendance batch service
      const response = await attendanceService.createStudentAttendanceBatch(records);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to submit attendance");
    }
  }
);

export const teacherSlice = createSlice({
  name: "teacher",
  initialState,
  reducers: {
    /** Update the editable basic profile fields (local mock) */
    updateBasicProfile(state, action: PayloadAction<Partial<TeacherProfileBasic>>) {
      Object.assign(state.basicProfile, action.payload);
    },

    /** Initialize the attendance session with student IDs */
    initAttendanceSession(state, action: PayloadAction<{ studentIds: string[], classId: string }>) {
      state.attendanceSession = {
        entries: action.payload.studentIds.map((id) => ({ studentId: id, status: null })),
        currentIndex: 0,
        submitted: false,
        isFirstLecture: true,
        classId: action.payload.classId,
      };
    },

    /** Mark a student in the attendance session */
    markAttendance(
      state,
      action: PayloadAction<{ studentId: string; status: "PRESENT" | "ABSENT" | "LATE" }>
    ) {
      const entry = state.attendanceSession.entries.find(
        (e) => e.studentId === action.payload.studentId
      );
      if (entry) {
        entry.status = action.payload.status;
      }
      // Advance to next ungraded student
      const nextIndex = state.attendanceSession.entries.findIndex((e) => e.status === null);
      state.attendanceSession.currentIndex = nextIndex === -1 ? state.attendanceSession.entries.length : nextIndex;
    },

    /** Mark session as submitted */
    submitAttendanceSession(state) {
      state.attendanceSession.submitted = true;
    },

    /** Reset the attendance session */
    resetAttendanceSession(state) {
      state.attendanceSession = initialState.attendanceSession;
    },

    /** Clear notification count */
    clearNotifications(state) {
      state.notificationCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // Schedule Fetch
      .addCase(fetchTeacherSchedule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeacherSchedule.fulfilled, (state, action) => {
        state.loading = false;
        state.schedule = action.payload || [];
      })
      .addCase(fetchTeacherSchedule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Roster Fetch
      .addCase(fetchClassRoster.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClassRoster.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRoster = action.payload || [];
      })
      .addCase(fetchClassRoster.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Submit Attendance
      .addCase(submitAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitAttendance.fulfilled, (state) => {
        state.loading = false;
        state.attendanceSession.submitted = true;
      })
      .addCase(submitAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  updateBasicProfile,
  initAttendanceSession,
  markAttendance,
  submitAttendanceSession,
  resetAttendanceSession,
  clearNotifications,
} = teacherSlice.actions;

export const teacherReducer = teacherSlice.reducer;
