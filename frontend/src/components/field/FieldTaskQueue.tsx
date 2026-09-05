import React from "react";
import { FieldTask } from "@/types";
import { TelemetryBadge } from "@/components/foundation/TelemetryBadge";
import { HardHat, MapPin, ChevronRight, Clock } from "lucide-react";

interface FieldTaskQueueProps {
  tasks: FieldTask[];
  selectedTaskId: string;
  onSelectTask: (taskId: string) => void;
  className?: string;
}

export function FieldTaskQueue({
  tasks,
  selectedTaskId,
  onSelectTask,
  className = "",
}: FieldTaskQueueProps) {
  if (tasks.length === 0) {
    return (
      <div className={`card-quiet p-6 text-center text-xs text-text-muted font-sans space-y-2 ${className}`}>
        <HardHat className="w-6 h-6 mx-auto opacity-40 text-civic-amber" />
        <p className="font-bold text-white">No Active Squad Tasks</p>
        <p className="text-[11px] text-text-secondary">All assigned municipal work orders for your squad have been resolved.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 font-sans ${className}`} aria-label="Assigned squad tasks list">
      <div className="flex items-center justify-between font-mono-data text-xs pb-1 border-b border-border-subtle">
        <span className="font-bold text-white uppercase tracking-wider">
          Squad Task Queue
        </span>
        <span className="badge-neutral text-[10px]">{tasks.length} Assigned</span>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => {
          const isSelected = task.id === selectedTaskId;
          const isCritical = task.priority === "critical";

          return (
            <div
              key={task.id}
              onClick={() => onSelectTask(task.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectTask(task.id);
                }
              }}
              tabIndex={0}
              role="button"
              aria-pressed={isSelected}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer min-h-[48px] space-y-2 ${
                isSelected
                  ? "bg-surface-elevated border-border-focus ring-1 ring-civic-cyan/40 shadow-elevation-md"
                  : "bg-surface-base border-border-subtle hover:bg-surface-elevated/60 hover:border-border-medium"
              }`}
            >
              {/* Task Header */}
              <div className="flex items-center justify-between text-xs font-mono-data">
                <span className="font-bold text-white">{task.id}</span>
                <div className="flex items-center gap-1.5">
                  <TelemetryBadge status={task.priority} />
                  <TelemetryBadge status={task.status} />
                </div>
              </div>

              {/* Site Address */}
              <div className="flex items-center gap-1.5 text-xs text-text-secondary truncate">
                <MapPin className="w-3.5 h-3.5 text-civic-cyan shrink-0" />
                <span className="truncate">{task.siteAddress}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FieldTaskQueue;
