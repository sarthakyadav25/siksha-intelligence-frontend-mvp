import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Users, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { attendanceService } from "@/services/attendance";
import type { StudentAttendanceRequestDTO } from "@/services/types/attendance";
import type { TeacherStudentResponseDto } from "@/services/types/teacher";
import { useAppSelector } from "@/store/hooks";

type AttendanceCode = "P" | "A" | "L";

type Props = {
  students: TeacherStudentResponseDto[];
  sectionUuid: string;
  onSubmitSuccess?: () => void;
};

const order: AttendanceCode[] = ["P", "A", "L"];

const styleMap: Record<AttendanceCode, string> = {
  P: "ring-emerald-500/70",
  A: "ring-red-500/70",
  L: "ring-amber-500/70",
};

export default function QuickAttendanceGrid({ students, sectionUuid, onSubmitSuccess }: Props) {
  const [state, setState] = useState<Record<string, AttendanceCode>>({});
  const [submitting, setSubmitting] = useState(false);
  const user = useAppSelector((s) => s.auth.user);

  useEffect(() => {
    const next: Record<string, AttendanceCode> = {};
    students.forEach((s) => {
      next[s.uuid] = "P";
    });
    setState(next);
  }, [students, sectionUuid]);

  const summary = useMemo(() => {
    const values = Object.values(state);
    return {
      P: values.filter((v) => v === "P").length,
      A: values.filter((v) => v === "A").length,
      L: values.filter((v) => v === "L").length,
    };
  }, [state]);

  const cycle = (uuid: string) => {
    setState((prev) => {
      const current = prev[uuid] ?? "P";
      const next = order[(order.indexOf(current) + 1) % order.length];
      return { ...prev, [uuid]: next };
    });
  };

  const markAllPresent = () => {
    setState((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        next[k] = "P";
      });
      return next;
    });
  };

  const submit = async () => {
    if (students.length === 0) return;
    setSubmitting(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const maybeStaffId = Number.parseInt(String(user?.userId ?? ""), 10);
      const payload: StudentAttendanceRequestDTO[] = students.map((s) => ({
        studentUuid: s.uuid,
        attendanceShortCode: state[s.uuid] ?? "P",
        attendanceDate: today,
        takenByStaffId: Number.isNaN(maybeStaffId) ? undefined : maybeStaffId,
        takenByStaffUuid: Number.isNaN(maybeStaffId) ? String(user?.userId ?? "") : undefined,
      }));
      await attendanceService.createStudentAttendanceBatch(payload);
      toast.success("Attendance submitted");
      onSubmitSuccess?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Failed to submit attendance");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {students.map((student) => (
          <button
            key={student.uuid}
            type="button"
            onClick={() => cycle(student.uuid)}
            className="rounded-xl border border-border/60 bg-background/60 p-2 text-left transition hover:bg-accent/40"
          >
            <div className="flex items-center gap-2">
              <UserAvatar name={`${student.firstName} ${student.lastName}`} profileUrl={student.profileUrl} className={`h-8 w-8 ring-2 ${styleMap[state[student.uuid] ?? "P"]}`} />
              <div>
                <p className="text-xs font-semibold text-foreground line-clamp-1">{student.firstName} {student.lastName}</p>
                <p className="text-[11px] text-muted-foreground">#{student.rollNumber}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {students.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Users className="mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No students found for this class. Check that students are enrolled in this section.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-4 w-4" /> {summary.P}</span>
          <span className="flex items-center gap-1 text-red-700"><XCircle className="h-4 w-4" /> {summary.A}</span>
          <span className="flex items-center gap-1 text-amber-700"><Clock3 className="h-4 w-4" /> {summary.L}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={markAllPresent}>Mark All Present</Button>
          <Button size="sm" onClick={submit} disabled={submitting}>{submitting ? "Submitting..." : "Submit Attendance"}</Button>
        </div>
      </div>
    </div>
  );
}
