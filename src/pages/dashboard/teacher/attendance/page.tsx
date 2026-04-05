import { useCallback } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import type { PanInfo } from "framer-motion";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  initAttendanceSession,
  markAttendance,
  submitAttendance,
  fetchTeacherSchedule,
  fetchClassRoster,
  submitAttendanceSession,
} from "@/store/slices/teacherSlice";
import { toast } from "sonner";
import {
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  Send,
  RotateCcw,
  Lock,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/UserAvatar";
import type { StudentCard } from "@/services/teacherService";
import { useEffect } from "react";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// ── Swipe Card Component ──────────────────────────────────────────────
function SwipeCard({
  student,
  onSwipe,
}: {
  student: StudentCard;
  onSwipe: (dir: "left" | "right") => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const presentOpacity = useTransform(x, [0, 100], [0, 1]);
  const absentOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      onSwipe("right");
    } else if (info.offset.x < -threshold) {
      onSwipe("left");
    }
  };

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
    >
      <div className="relative h-full rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
        {/* Swipe indicators */}
        <motion.div
          className="absolute top-6 right-6 z-10 rounded-xl border-2 border-emerald-500 px-4 py-1.5"
          style={{ opacity: presentOpacity }}
        >
          <span className="text-lg font-bold text-emerald-500">PRESENT</span>
        </motion.div>
        <motion.div
          className="absolute top-6 left-6 z-10 rounded-xl border-2 border-red-500 px-4 py-1.5"
          style={{ opacity: absentOpacity }}
        >
          <span className="text-lg font-bold text-red-500">ABSENT</span>
        </motion.div>

        {/* Student info */}
        <div className="flex flex-col items-center justify-center h-full p-8">
          <UserAvatar
            name={student.name}
            profileUrl={student.profileUrl}
            className="h-24 w-24 ring-4 ring-primary/10 text-3xl mb-6"
          />
          <h2 className="text-xl font-bold text-foreground">{student.name}</h2>
          <p className="text-sm text-muted-foreground mt-1">Roll #{student.rollNumber}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Section {student.section}</p>

          <div className="flex items-center gap-6 mt-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ChevronLeft className="h-4 w-4 text-red-400" />
              Swipe left — Absent
            </span>
            <span className="flex items-center gap-1.5">
              Swipe right — Present
              <ChevronRight className="h-4 w-4 text-emerald-400" />
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Page Component ────────────────────────────────────────────────────
export default function TeacherAttendance() {
  const dispatch = useAppDispatch();
  const session = useAppSelector((s) => s.teacher.attendanceSession);
  const currentRoster = useAppSelector((s) => s.teacher.currentRoster);
  const schedule = useAppSelector((s) => s.teacher.schedule);
  const user = useAppSelector((s) => s.auth.user);
  const isLoading = useAppSelector((s) => s.teacher.loading);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (user?.userId && schedule.length === 0) {
      dispatch(fetchTeacherSchedule(user.userId));
    }
  }, [dispatch, user?.userId, schedule.length]);

  // Derive first lecture
  const firstLecture = schedule && schedule.length > 0 ? schedule[0] : null;

  useEffect(() => {
    if (firstLecture && currentRoster.length === 0) {
      // Assuming classId is mapped to className for now, or the API expects className
      dispatch(fetchClassRoster({ classId: firstLecture.className, date: today }));
    }
  }, [dispatch, firstLecture, currentRoster.length, today]);

  // Initialize session
  useEffect(() => {
    if (session.entries.length === 0 && currentRoster.length > 0 && firstLecture) {
      dispatch(initAttendanceSession({
        studentIds: currentRoster.map((s) => s.studentId),
        classId: firstLecture.className
      }));
    }
  }, [dispatch, session.entries.length, currentRoster, firstLecture]);

  const currentStudent = currentRoster.find(
    (s) => s.studentId === session.entries[session.currentIndex]?.studentId
  );

  const totalDone = session.entries.filter((e) => e.status !== null).length;
  const totalEntries = session.entries.length;
  const allDone = totalDone === totalEntries && totalEntries > 0;

  const handleSwipe = useCallback(
    (dir: "left" | "right") => {
      if (!currentStudent) return;
      dispatch(
        markAttendance({
          studentId: currentStudent.studentId,
          status: dir === "right" ? "PRESENT" : "ABSENT",
        })
      );
      toast(dir === "right" ? "✅ Marked Present" : "❌ Marked Absent", {
        description: currentStudent.name,
        duration: 1500,
      });
    },
    [currentStudent, dispatch]
  );

  const handleMarkLate = (studentId: string) => {
    dispatch(markAttendance({ studentId, status: "LATE" }));
    const student = currentRoster.find((s) => s.studentId === studentId);
    toast("⏰ Marked Late", { description: student?.name, duration: 1500 });
  };

  const handleSubmit = () => {
    if (!firstLecture) return;
    
    // Check if the backend returns proper auth info
    const staffId = user?.userId ? parseInt(user.userId) : 1; 

    const records = session.entries.map((req) => ({
      ...req,
      date: today,
      staffId: staffId, 
      classId: firstLecture.className,
      status: req.status || "ABSENT" // default unresolved to absent?
    }));

    dispatch(submitAttendance(records as any)).unwrap().then(() => {
      dispatch(submitAttendanceSession());
      toast.success("Attendance roster submitted successfully!");
    }).catch(err => {
      toast.error(err || "Failed to submit attendance");
    });
  };

  const handleReset = () => {
    if (firstLecture) {
      dispatch(initAttendanceSession({
        studentIds: currentRoster.map((s) => s.studentId),
        classId: firstLecture.className
      }));
      toast.info("Session reset");
    }
  };

  // Is it the first lecture?
  const isFirstLecture = session.isFirstLecture;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
         <RotateCcw className="h-8 w-8 text-primary animate-spin mb-4" />
         <p className="text-sm text-muted-foreground">Loading attendance data...</p>
      </div>
    );
  }

  if (!isFirstLecture) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Lock className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold text-foreground">Attendance Locked</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          Attendance can only be marked during the first lecture of the day. The session for today's
          first period has already been completed.
        </p>
      </div>
    );
  }

  if (session.submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Roster Submitted!</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          Attendance for {totalEntries} students has been recorded. You can view the results in the dashboard.
        </p>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={handleReset} className="gap-1.5">
            <RotateCcw className="h-4 w-4" />
            New Session
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-10 max-w-2xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Mark Attendance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Swipe cards to mark each student. First lecture session only.
        </p>
      </motion.div>

      {/* Progress */}
      <motion.div variants={itemVariants} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">Progress</span>
          <span className="text-xs font-semibold text-foreground">
            {totalDone} / {totalEntries}
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${totalEntries > 0 ? (totalDone / totalEntries) * 100 : 0}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <UserCheck className="h-3 w-3 text-emerald-500" />
            {session.entries.filter((e) => e.status === "PRESENT").length} Present
          </span>
          <span className="flex items-center gap-1">
            <UserX className="h-3 w-3 text-red-500" />
            {session.entries.filter((e) => e.status === "ABSENT").length} Absent
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-amber-500" />
            {session.entries.filter((e) => e.status === "LATE").length} Late
          </span>
        </div>
      </motion.div>

      {/* Swipe Area */}
      {!allDone && currentStudent ? (
        <motion.div variants={itemVariants} className="relative h-[340px]">
          <AnimatePresence mode="wait">
            <SwipeCard
              key={currentStudent.studentId}
              student={currentStudent}
              onSwipe={handleSwipe}
            />
          </AnimatePresence>
        </motion.div>
      ) : null}

      {/* Mark Late Button */}
      {!allDone && (
        <motion.div variants={itemVariants} className="flex flex-col items-center gap-3">
          <div className="relative">
            <button
              onClick={() => {
                if (currentStudent) handleMarkLate(currentStudent.studentId);
              }}
              className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-all hover:scale-105 active:scale-95"
              title="Mark Late"
            >
              <Clock className="h-6 w-6" />
            </button>
          </div>
          <span className="text-xs text-muted-foreground">Mark Late</span>
        </motion.div>
      )}

      {/* Submit Roster Button */}
      {allDone && !session.submitted && (
        <motion.div
          variants={itemVariants}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="text-center mb-2">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-foreground">All Students Marked!</h3>
            <p className="text-sm text-muted-foreground">
              Review the session or submit the roster.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleReset} className="gap-1.5">
              <RotateCcw className="h-4 w-4" />
              Redo
            </Button>
            <Button onClick={handleSubmit} className="gap-1.5">
              <Send className="h-4 w-4" />
              Submit Roster
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
