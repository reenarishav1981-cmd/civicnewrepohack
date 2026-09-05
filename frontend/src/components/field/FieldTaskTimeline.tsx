import React from "react";
import { FieldTask } from "@/types";
import { Clock, CheckCircle2, Navigation, Wrench, HardHat } from "lucide-react";

interface FieldTaskTimelineProps {
  task: FieldTask;
  className?: string;
}

export function FieldTaskTimeline({ task, className = "" }: FieldTaskTimelineProps) {
  const events = [
    {
      title: "Task Assigned & Dispatched",
      time: task.assignedAt ? new Date(task.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "08:00 AM",
      icon: HardHat,
      isDone: true,
    },
    {
      title: "Site Work Initialized",
      time: task.startedAt ? new Date(task.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Pending Arrival",
      icon: Wrench,
      isDone: !!task.startedAt || task.status === "in_progress" || task.status === "completed",
    },
    {
      title: "Task Completed & Evidence Logged",
      time: task.completedAt ? new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Pending Completion",
      icon: CheckCircle2,
      isDone: task.status === "completed",
    },
  ];

  return (
    <div className={`card-quiet p-5 sm:p-6 space-y-3.5 font-mono-data text-xs ${className}`} aria-label="Field Task Execution History">
      <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
        <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider">
          <Clock className="w-4 h-4 text-civic-cyan" />
          <span>Task Execution History</span>
        </div>
        <span className="text-[10px] text-text-muted">Audit Log</span>
      </div>

      <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
        {events.map((ev, idx) => {
          const Icon = ev.icon;
          return (
            <div key={idx} className="relative pl-7 space-y-0.5">
              <span className={`absolute left-2 top-1.5 w-2.5 h-2.5 rounded-full border-2 ${
                ev.isDone ? "bg-civic-green border-civic-green" : "bg-surface-base border-border-subtle"
              }`} />
              <div className="flex items-center justify-between text-xs">
                <span className={`font-bold font-sans ${ev.isDone ? "text-white" : "text-text-muted"}`}>
                  {ev.title}
                </span>
                <span className="text-[10px] text-text-muted font-mono-data">{ev.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FieldTaskTimeline;
