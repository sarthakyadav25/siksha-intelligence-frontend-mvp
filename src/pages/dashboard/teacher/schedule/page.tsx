import { useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, MapPin, BookOpen, ChevronRight, Coffee } from "lucide-react";
import { useAppSelector } from "@/store/hooks";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function TeacherSchedule() {
  const backendSchedule = useAppSelector((s) => s.teacher.schedule);

  // Determine which class is "next" based on current time
  const schedule = useMemo(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    let foundNext = false;

    return backendSchedule.map((entry) => {
      const [h, m] = entry.time.split(":").map(Number);
      const [eh, em] = entry.endTime.split(":").map(Number);
      const startMin = h * 60 + m;
      const endMin = eh * 60 + em;

      const isCurrent = currentMinutes >= startMin && currentMinutes < endMin;
      const isUpcoming = !foundNext && currentMinutes < startMin;

      if (isUpcoming) foundNext = true;

      return {
        ...entry,
        isNext: isCurrent || isUpcoming,
        isPast: currentMinutes >= endMin,
        isCurrent,
      };
    });
  }, []);

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const nextClass = schedule.find((s) => s.isNext);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-10 max-w-3xl">
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Today's Schedule</h1>
        <p className="mt-1 text-sm text-muted-foreground">{formattedDate}</p>
      </motion.div>

      {/* Next Class Highlight */}
      {nextClass && (
        <motion.div
          variants={item}
          className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              {nextClass.isCurrent ? "Current Class" : "Next Class"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-foreground">{nextClass.subject}</h2>
              <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {nextClass.time} — {nextClass.endTime}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {nextClass.room}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">{nextClass.className}</p>
              <p className="text-xs text-muted-foreground">Section {nextClass.section}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Full Timeline */}
      <motion.div variants={item} className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-foreground">Full Schedule</h3>
        </div>
        <div className="divide-y divide-border">
          {schedule.map((entry, index) => {
            // Check for breaks between classes
            const prevEntry = index > 0 ? schedule[index - 1] : null;
            const hasBreak =
              prevEntry &&
              (() => {
                const [peh, pem] = prevEntry.endTime.split(":").map(Number);
                const [h, m] = entry.time.split(":").map(Number);
                return h * 60 + m - (peh * 60 + pem) >= 15;
              })();

            return (
              <div key={entry.id}>
                {hasBreak && (
                  <div className="flex items-center gap-3 px-5 py-2.5 bg-muted/30">
                    <Coffee className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Break</span>
                  </div>
                )}
                <div
                  className={`flex items-center gap-4 px-5 py-4 transition-colors ${
                    entry.isNext
                      ? "bg-primary/5 border-l-2 border-l-primary"
                      : entry.isPast
                      ? "opacity-50"
                      : "hover:bg-accent/30"
                  }`}
                >
                  {/* Time */}
                  <div className="w-20 shrink-0 text-right">
                    <p className="text-sm font-semibold text-foreground">{entry.time}</p>
                    <p className="text-xs text-muted-foreground">{entry.endTime}</p>
                  </div>

                  {/* Timeline dot */}
                  <div className="relative flex flex-col items-center">
                    <div
                      className={`h-3 w-3 rounded-full border-2 ${
                        entry.isNext
                          ? "border-primary bg-primary"
                          : entry.isPast
                          ? "border-muted-foreground/40 bg-muted-foreground/20"
                          : "border-border bg-card"
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-sm font-semibold text-foreground">{entry.subject}</p>
                      {entry.isNext && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                          {entry.isCurrent ? "NOW" : "NEXT"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {entry.className} · Section {entry.section}
                    </p>
                  </div>

                  {/* Room */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                    <MapPin className="h-3.5 w-3.5" />
                    {entry.room}
                  </div>

                  <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {schedule.length === 0 && (
        <motion.div variants={item} className="flex flex-col items-center justify-center py-16 text-center">
          <Coffee className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-semibold text-foreground">No Classes Today</h2>
          <p className="text-sm text-muted-foreground mt-1">Enjoy your day off!</p>
        </motion.div>
      )}
    </motion.div>
  );
}
