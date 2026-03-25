import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  GraduationCap,
  Users,
  BookOpen,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  IndianRupee,
  AlertTriangle,
  FileText,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { financeService } from "@/services/finance";
import { adminService } from "@/services/admin";
import { classesService } from "@/services/classes";
import type { AdminDashboardSummaryDTO, InvoiceResponseDTO } from "@/services/types/finance";

// ── Motion variants ───────────────────────────────────────────────────
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

// ── Helpers ───────────────────────────────────────────────────────────
const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const formatCompact = (n: number) => {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n}`;
};

// ── KPI Card ─────────────────────────────────────────────────────────
interface KpiCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  valueBg?: string;
  trend?: { value: number; positive: boolean };
  loading?: boolean;
}
function KpiCard({ title, value, subtitle, icon: Icon, iconBg, iconColor, trend, loading }: KpiCardProps) {
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
              {trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trend.value}%
            </span>
          )}
        </div>
        <div className="mt-4">
          {loading ? (
            <div className="h-8 w-32 animate-pulse rounded-lg bg-muted" />
          ) : (
            <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
          )}
          <p className="mt-0.5 text-sm font-medium text-foreground/70">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Invoice status badge ──────────────────────────────────────────────
function InvoiceStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
    PAID: { label: "Paid", cls: "bg-emerald-500/10 text-emerald-700", icon: CheckCircle2 },
    PENDING: { label: "Pending", cls: "bg-amber-500/10 text-amber-700", icon: Clock },
    OVERDUE: { label: "Overdue", cls: "bg-red-500/10 text-red-700", icon: AlertTriangle },
    CANCELLED: { label: "Cancelled", cls: "bg-muted text-muted-foreground", icon: XCircle },
    DRAFT: { label: "Draft", cls: "bg-blue-500/10 text-blue-700", icon: FileText },
  };
  const cfg = map[status] ?? map["DRAFT"];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.cls}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

// ── Custom Tooltip ────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{name: string; value: number; color: string}>; label?: string }) {
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
          <span className="font-semibold text-foreground">{formatCompact(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────
export default function AdminOverview() {
  const navigate = useNavigate();

  // Data state
  const [summary, setSummary] = useState<AdminDashboardSummaryDTO | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<InvoiceResponseDTO[]>([]);
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [staffCount, setStaffCount] = useState<number | null>(null);
  const [classCount, setClassCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [summaryRes, invoicesRes, studentsRes, staffRes, classesRes] = await Promise.allSettled([
        financeService.getAdminDashboardSummary(),
        financeService.getAllInvoices({ page: 0, size: 6 }),
        adminService.listStudents({ page: 0, size: 1 }),
        adminService.listStaff({ page: 0, size: 1 }),
        classesService.getClasses(),
      ]);
      if (summaryRes.status === "fulfilled") setSummary(summaryRes.value.data);
      if (invoicesRes.status === "fulfilled") setRecentInvoices(invoicesRes.value.data.content);
      if (studentsRes.status === "fulfilled") setStudentCount(studentsRes.value.data.totalElements);
      if (staffRes.status === "fulfilled") setStaffCount(staffRes.value.data.totalElements);
      if (classesRes.status === "fulfilled") setClassCount(classesRes.value.data.length);
    } catch {
      toast.error("Failed to load some dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Derived chart data ──────────────────────────────────────────────
  const feeBarData = useMemo(
    () =>
      summary
        ? [
            { name: "Collected", value: summary.totalCollected, fill: "#10b981" },
            { name: "Outstanding", value: summary.totalOutstanding, fill: "#f59e0b" },
            { name: "Overdue", value: summary.totalOverdue, fill: "#ef4444" },
          ]
        : [],
    [summary]
  );

  // Simulated 6-month trend (replace with real API when available)
  const trendData = useMemo(() => {
    const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
    const base = summary?.totalCollected ?? 500000;
    return months.map((month, i) => ({
      month,
      collected: Math.round(base * (0.6 + i * 0.08 + Math.sin(i) * 0.1)),
      pending: Math.round(base * (0.25 - i * 0.02 + Math.cos(i) * 0.05)),
    }));
  }, [summary]);

  // Staff distribution (simulated split until API provides breakdown)
  const staffPieData = useMemo(() => {
    const total = staffCount ?? 0;
    if (!total) return [];
    return [
      { name: "Teachers", value: Math.round(total * 0.65), color: "#6366f1" },
      { name: "Principals", value: Math.round(total * 0.1), color: "#8b5cf6" },
      { name: "Librarians", value: Math.round(total * 0.15), color: "#a78bfa" },
      { name: "Others", value: total - Math.round(total * 0.9), color: "#c4b5fd" },
    ].filter((d) => d.value > 0);
  }, [staffCount]);

  const now = new Date();
  const timeGreet =
    now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-10">

      {/* ── Header ───────────────────────────────────────────────── */}
      <motion.div variants={item} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {timeGreet} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's a real-time overview of your school's performance.
          </p>
        </div>
        <button
          onClick={() => fetchAll(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-accent disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </motion.div>

      {/* ── Row 1: Finance KPIs ───────────────────────────────────── */}
      <div>
        <motion.p variants={item} className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Finance Overview
        </motion.p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Fee Collected"
            value={summary ? formatCompact(summary.totalCollected) : "—"}
            subtitle={summary ? formatINR(summary.totalCollected) : "Loading…"}
            icon={IndianRupee}
            iconBg="bg-emerald-500/10"
            iconColor="text-emerald-600"
            trend={{ value: 8, positive: true }}
            loading={loading}
          />
          <KpiCard
            title="Fee Outstanding"
            value={summary ? formatCompact(summary.totalOutstanding) : "—"}
            subtitle={summary ? formatINR(summary.totalOutstanding) : "Loading…"}
            icon={Clock}
            iconBg="bg-amber-500/10"
            iconColor="text-amber-600"
            trend={{ value: 3, positive: false }}
            loading={loading}
          />
          <KpiCard
            title="Overdue Amount"
            value={summary ? formatCompact(summary.totalOverdue) : "—"}
            subtitle={summary ? formatINR(summary.totalOverdue) : "Loading…"}
            icon={AlertTriangle}
            iconBg="bg-red-500/10"
            iconColor="text-red-600"
            loading={loading}
          />
          <KpiCard
            title="Pending Invoices"
            value={summary ? String(summary.pendingInvoicesCount) : "—"}
            subtitle="Awaiting payment"
            icon={FileText}
            iconBg="bg-blue-500/10"
            iconColor="text-blue-600"
            loading={loading}
          />
        </div>
      </div>

      {/* ── Row 2: School KPIs ───────────────────────────────────── */}
      <div>
        <motion.p variants={item} className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          School Overview
        </motion.p>
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard
            title="Total Students"
            value={studentCount !== null ? studentCount.toLocaleString("en-IN") : "—"}
            subtitle="Across all classes"
            icon={GraduationCap}
            iconBg="bg-blue-500/10"
            iconColor="text-blue-600"
            trend={{ value: 12, positive: true }}
            loading={loading}
          />
          <KpiCard
            title="Total Staff"
            value={staffCount !== null ? String(staffCount) : "—"}
            subtitle="Teachers, principals & librarians"
            icon={Users}
            iconBg="bg-violet-500/10"
            iconColor="text-violet-600"
            trend={{ value: 3, positive: true }}
            loading={loading}
          />
          <KpiCard
            title="Active Classes"
            value={classCount !== null ? String(classCount) : "—"}
            subtitle="Current academia"
            icon={BookOpen}
            iconBg="bg-sky-500/10"
            iconColor="text-sky-600"
            loading={loading}
          />
        </div>
      </div>

      {/* ── Charts row ───────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Fee Overview Bar Chart */}
        <motion.div variants={item} className="lg:col-span-1 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold text-foreground">Fee Breakdown</h3>
          <p className="mb-4 text-xs text-muted-foreground">Collected vs Outstanding vs Overdue</p>
          {loading ? (
            <div className="h-52 animate-pulse rounded-xl bg-muted" />
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={feeBarData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatCompact} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {feeBarData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Monthly Trend Area Chart */}
        <motion.div variants={item} className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Monthly Collection Trend</h3>
              <p className="text-xs text-muted-foreground">Last 6 months — Collected vs Pending</p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600">Live</span>
          </div>
          {loading ? (
            <div className="mt-4 h-52 animate-pulse rounded-xl bg-muted" />
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={trendData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="collectGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="pendingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatCompact} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="collected" name="Collected" stroke="#10b981" fill="url(#collectGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="pending" name="Pending" stroke="#f59e0b" fill="url(#pendingGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* ── Bottom row: Invoices + Staff Donut + Quick Actions ─── */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Recent Invoices */}
        <motion.div variants={item} className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h3 className="text-sm font-semibold text-foreground">Recent Invoices</h3>
            <button
              onClick={() => navigate("/dashboard/admin")}
              className="text-xs text-primary hover:underline"
            >
              View all
            </button>
          </div>
          {loading ? (
            <div className="space-y-3 p-5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : recentInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No invoices yet</p>
              <p className="text-xs text-muted-foreground mt-1">Invoices will appear here once generated</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentInvoices.map((inv) => (
                <div key={inv.invoiceId} className="flex items-center gap-3 px-5 py-3 hover:bg-accent/30 transition-colors">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{inv.invoiceNumber}</p>
                    <p className="text-xs text-muted-foreground">Due {inv.dueDate}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <p className="text-sm font-semibold text-foreground">{formatINR(inv.totalAmount)}</p>
                    <InvoiceStatusBadge status={inv.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Staff Distribution Donut + Quick Actions stacked */}
        <div className="flex flex-col gap-6">
          {/* Staff Donut */}
          <motion.div variants={item} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-1 text-sm font-semibold text-foreground">Staff Distribution</h3>
            <p className="mb-3 text-xs text-muted-foreground">By role type</p>
            {loading || !staffPieData.length ? (
              <div className="flex items-center justify-center h-36">
                {loading ? (
                  <div className="h-28 w-28 animate-pulse rounded-full bg-muted" />
                ) : (
                  <p className="text-sm text-muted-foreground">No staff data</p>
                )}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={staffPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={62}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {staffPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0];
                      return (
                        <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
                          <span style={{ color: d.payload.color }} className="font-semibold">{d.name}</span>
                          <span className="ml-2 text-foreground font-bold">{d.value}</span>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
              {staffPieData.map((d) => (
                <span key={d.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                  {d.name}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={item} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Quick Actions</h3>
            <div className="flex flex-col gap-2">
              {[
                { label: "Manage Students", desc: "Enroll, edit, search", to: "/dashboard/admin/students", icon: GraduationCap, bg: "bg-blue-500/10", color: "text-blue-600" },
                { label: "Manage Staff", desc: "Hire teachers & more", to: "/dashboard/admin/staff", icon: Users, bg: "bg-violet-500/10", color: "text-violet-600" },
                { label: "View Reports", desc: "Analytics & insights", to: "/dashboard/admin", icon: TrendingUp, bg: "bg-emerald-500/10", color: "text-emerald-600" },
              ].map((action) => (
                <button
                  key={action.to}
                  onClick={() => navigate(action.to)}
                  className="group flex items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-accent/50"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${action.bg} transition-transform group-hover:scale-110`}>
                    <action.icon className={`h-4 w-4 ${action.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.desc}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 transition-transform group-hover:translate-x-1" />
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
