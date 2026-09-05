import React from "react";
import { TaskStatus } from "@/types";
import { CheckCircle2, Navigation, MapPin, Wrench, Check } from "lucide-react";

interface TaskExecutionHUDProps {
  status: TaskStatus;
  className?: string;
}

const STAGES: { key: TaskStatus; label: string; icon: React.FC<{ className?: string }> }[] = [
  { key: "assigned", label: "Assigned", icon: CheckCircle2 },
  { key: "en_route", label: "En Route", icon: Navigation },
  { key: "arrived", label: "Arrived", icon: MapPin },
  { key: "in_progress", label: "In Progress", icon: Wrench },
  { key: "completed", label: "Completed", icon: Check },
];

export function TaskExecutionHUD({ status, className = "" }: TaskExecutionHUDProps) {
  const currentIndex = STAGES.findIndex((s) => s.key === status);

  return (
    <div className={`card-quiet p-4 sm:p-5 space-y-3 font-mono-data text-xs ${className}`} aria-label="Task Execution Lifecycle">
      <div className="flex items-center justify-between text-[11px] text-text-muted pb-2 border-b border-border-subtle uppercase font-bold">
        <span>Execution Stage</span>
        <span className="text-civic-cyan font-bold">{status.toUpperCase().replace("_", " ")}</span>
      </div>

      {/* 5-Stage Stepper HUD */}
      <div className="grid grid-cols-5 gap-1 sm:gap-2 text-center text-[10px]">
        {STAGES.map((stg, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isFuture = idx > currentIndex;
          const Icon = stg.icon;

          return (
            <div
              key={stg.key}
              className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                isCurrent
                  ? "bg-surface-elevated border-border-focus text-white ring-1 ring-civic-cyan/40 shadow-elevation-sm font-bold"
                  : isDone
                  ? "bg-civic-green/10 border-civic-green/30 text-civic-green"
                  : "bg-surface-base border-border-subtle text-text-muted opacity-50"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  isCurrent
                    ? "bg-civic-blue text-white"
                    : isDone
                    ? "bg-civic-green text-void font-bold"
                    : "bg-surface-elevated text-text-muted"
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Icon className="w-3 h-3" />}
              </div>
              <span className="truncate w-full font-sans">{stg.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TaskExecutionHUD;
