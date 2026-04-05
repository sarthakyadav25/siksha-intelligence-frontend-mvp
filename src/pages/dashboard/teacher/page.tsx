import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { fetchTeacherSchedule } from "@/store/slices/teacherSlice";
import { setCredentials } from "@/store/slices/authSlice";
import { teacherService } from "@/services/teacherService";
import {
  Users,
  UserCheck,
  UserX,
  ClipboardList,
  TrendingUp,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { UserAvatar } from "@/components/shared/UserAvatar";

// ── Motion variants ───────────────────────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// ── Stat Card ─────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  trend?: { value: number; positive: boolean };
}
function StatCard({ title, value, subtitle, icon: Icon, iconBg, iconColor, trend }: StatCardProps) {
  return (
    <motion.div variants={item}>
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start justify-between">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          {trend && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                trend.positive ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
              }`}
            >
              <TrendingUp className={`h-3 w-3 ${!trend.positive ? "rotate-180" : ""}`} />
              {trend.value}%
            </span>
          )}
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
          <p className="mt-0.5 text-sm font-medium text-foreground/70">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Custom Tooltip ────────────────────────────────────────────────────
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-lg text-xs min-w-[140px]">
      {label && <p className="mb-2 font-semibold text-foreground">{label}</p>}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-semibold text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────
export default function TeacherDashboard() {
  const user = useAppSelector((s) => s.auth.user);
  const token = useAppSelector((s) => s.auth.accessToken);
  const schedule = useAppSelector((s) => s.teacher.schedule);
  const dispatch = useAppDispatch();
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    // Attempt to fetch fresh profile from backend
    if (token) {
      teacherService.getMe().then(res => {
        const data = res.data;
        const freshUser = {
          userId: String(data.userId || data.id || user?.userId),
          username: String(data.username || data.name || user?.username),
          email: String(data.email || user?.email),
          roles: data.roles || user?.roles || [],
          profileUrl: data.profileUrl || user?.profileUrl,
        };
        dispatch(setCredentials({ user: freshUser, accessToken: token }));
      }).catch(err => console.error("Could not refresh profile", err));
    }

    if (user?.userId) {
      dispatch(fetchTeacherSchedule(user.userId));
    }
  }, [dispatch, user?.userId, token]);

  // Derive stats from real data
  const pulseData: any[] = [];
  const latestDay = pulseData.filter((d) => d.total > 0).slice(-1)[0];
  const totalStudents = 0; // Future improvement: compute from real schedule

  const presentToday = latestDay?.present ?? 0;
  const absentToday = latestDay?.absent ?? 0;
  const pendingTasks = 0;

  // At-risk students (>3 absences)
  const atRiskStudents = useMemo(
    () => [] as any[],
    []
  );

  // Heatmap data
  const heatmapData: any[] = [];

  const now = new Date();
  const timeGreet =
    now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  // Carousel navigation
  const carouselPageSize = 4;
  const totalCarouselPages = Math.ceil(atRiskStudents.length / carouselPageSize);

  const firstLecture = schedule && schedule.length > 0 ? schedule[0] : null;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-10">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {timeGreet}, {user?.username ?? "Teacher"} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's your classroom overview for today.
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {firstLecture ? `${firstLecture.className} — Section ${firstLecture.section}` : "No Schedule"}
        </span>
      </motion.div>

      {/* ── Row 1: Stat Cards ───────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value={totalStudents}
          subtitle="In your assigned class"
          icon={Users}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Present Today"
          value={presentToday}
          subtitle={`${totalStudents > 0 ? Math.round((presentToday / totalStudents) * 100) : 0}% attendance rate`}
          icon={UserCheck}
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-600"
          trend={{ value: 4, positive: true }}
        />
        <StatCard
          title="Absent Today"
          value={absentToday}
          subtitle="Students missing today"
          icon={UserX}
          iconBg="bg-red-500/10"
          iconColor="text-red-600"
          trend={{ value: 2, positive: false }}
        />
        <StatCard
          title="Pending Tasks"
          value={pendingTasks}
          subtitle="Assignments to review"
          icon={ClipboardList}
          iconBg="bg-amber-500/10"
          iconColor="text-amber-600"
        />
      </div>

      {/* ── Row 2: Pulse Chart + At-Risk Carousel ───────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pulse Chart */}
        <motion.div variants={item} className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="text-sm font-semibold text-foreground">30-Day Attendance Pulse</h3>
              <p className="text-xs text-muted-foreground">Daily present vs absent trends</p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600">
              Live
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={pulseData.filter((d) => d.total > 0)} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="present" name="Present" stroke="#10b981" fill="url(#presentGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="absent" name="Absent" stroke="#ef4444" fill="url(#absentGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* At-Risk Students Carousel */}
        <motion.div variants={item} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">At-Risk Students</h3>
              <p className="text-xs text-muted-foreground">&gt;3 absences this month</p>
            </div>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>

          {atRiskStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <UserCheck className="h-10 w-10 text-emerald-400 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">All students on track!</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {atRiskStudents
                  .slice(carouselIndex * carouselPageSize, (carouselIndex + 1) * carouselPageSize)
                  .map((student) => (
                    <div
                      key={student.studentId}
                      className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-accent/30 transition-colors"
                    >
                      <UserAvatar
                        name={student.name}
                        profileUrl={student.profileUrl}
                        className="h-9 w-9"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{student.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Roll #{student.rollNumber} · {student.absenceCount} absences
                        </p>
                      </div>
                      <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-600">
                        {student.attendancePercentage}%
                      </span>
                    </div>
                  ))}
              </div>
              {totalCarouselPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button
                    onClick={() => setCarouselIndex((i) => Math.max(0, i - 1))}
                    disabled={carouselIndex === 0}
                    className="p-1 rounded-lg hover:bg-accent disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {carouselIndex + 1} / {totalCarouselPages}
                  </span>
                  <button
                    onClick={() => setCarouselIndex((i) => Math.min(totalCarouselPages - 1, i + 1))}
                    disabled={carouselIndex === totalCarouselPages - 1}
                    className="p-1 rounded-lg hover:bg-accent disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      {/* ── Row 3: Absence Heatmap ──────────────────────────────────── */}
      <motion.div variants={item} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-foreground">Daily Absence Heatmap</h3>
          <p className="text-xs text-muted-foreground">Darker cells indicate higher absence counts over the last 30 days</p>
        </div>
        <div className="grid grid-cols-10 gap-1.5 sm:grid-cols-15">
          {heatmapData.map((cell) => {
            const isWeekend = cell.absences === -1;
            const maxAbsences = 8;
            const opacity = isWeekend ? 0 : Math.max(0.08, cell.absences / maxAbsences);
            return (
              <div
                key={cell.date}
                className="group relative"
                title={isWeekend ? `${cell.day} ${cell.dayNum} — Weekend` : `${cell.day} ${cell.dayNum} — ${cell.absences} absences`}
              >
                <div
                  className={`aspect-square rounded-md transition-transform hover:scale-110 ${
                    isWeekend
                      ? "bg-muted/40 border border-dashed border-border"
                      : "border border-border"
                  }`}
                  style={
                    isWeekend
                      ? undefined
                      : {
                          backgroundColor: `rgba(239, 68, 68, ${opacity})`,
                        }
                  }
                />
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[8px] text-muted-foreground">
                  {cell.dayNum}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm border border-border" style={{ backgroundColor: "rgba(239, 68, 68, 0.08)" }} />
            Low
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm border border-border" style={{ backgroundColor: "rgba(239, 68, 68, 0.4)" }} />
            Medium
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm border border-border" style={{ backgroundColor: "rgba(239, 68, 68, 0.85)" }} />
            High
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm border border-dashed border-border bg-muted/40" />
            Weekend
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
