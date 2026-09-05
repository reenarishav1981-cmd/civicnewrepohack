import React from "react";
import { Incident, FieldTask } from "@/types";
import { HardHat } from "lucide-react";

interface TaskProgressionHUDProps {
  incident: Incident;
  activeTask?: FieldTask | null;
  className?: string;
}

export function TaskProgressionHUD({
  incident,
  activeTask,
  className = "",
}: TaskProgressionHUDProps) {
  // Determine actual progress from domain status and task execution state
  const isAssigned =
    incident.status === "assigned" ||
    incident.status === "in_progress" ||
    incident.status === "awaiting_verification" ||
    incident.status === "pending_verification" ||
    incident.status === "reopen_requested" ||
    incident.status === "resolved" ||
    incident.status === "closed" ||
    !!(activeTask && ["assigned", "en_route", "arrived", "in_progress", "completed"].includes(activeTask.status));

  const isEnRoute =
    incident.status === "in_progress" ||
    incident.status === "awaiting_verification" ||
    incident.status === "pending_verification" ||
    incident.status === "reopen_requested" ||
    incident.status === "resolved" ||
    incident.status === "closed" ||
    !!(activeTask && ["en_route", "arrived", "in_progress", "completed"].includes(activeTask.status));

  const isArrived =
    incident.status === "in_progress" ||
    incident.status === "awaiting_verification" ||
    incident.status === "pending_verification" ||
    incident.status === "reopen_requested" ||
    incident.status === "resolved" ||
    incident.status === "closed" ||
    !!(activeTask && ["arrived", "in_progress", "completed"].includes(activeTask.status));

  const isInProgress =
    incident.status === "in_progress" ||
    incident.status === "awaiting_verification" ||
    incident.status === "pending_verification" ||
    incident.status === "reopen_requested" ||
    incident.status === "resolved" ||
    incident.status === "closed" ||
    !!(activeTask && ["in_progress", "completed"].includes(activeTask.status));

  const isResolved = incident.status === "resolved" || incident.status === "closed";

  const stages = [
    { label: "Assigned", isDone: isAssigned },
    { label: "En Route", isDone: isEnRoute },
    { label: "Arrived", isDone: isArrived },
    { label: "In Progress", isDone: isInProgress },
    { label: "Resolved", isDone: isResolved },
  ];

  return (
    <section className={`card-quiet p-6 sm:p-7 space-y-4 font-mono-data ${className}`} aria-label="Field Task Progression Lifecycle">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border-subtle text-xs">
        <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider">
          <HardHat className="w-4 h-4 text-civic-amber" />
          <span>Field Task Progression Lifecycle</span>
        </div>
        <span className="text-[10px] text-text-muted">
          {activeTask ? `Task ID: ${activeTask.id}` : "Unassigned"}
        </span>
      </div>

      {/* 5-Stage Visual Progression HUD */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 text-[10.5px]">
        {stages.map((stg, i) => (
          <div
            key={i}
            className={`py-2.5 px-1 rounded-lg text-center font-bold border transition-all ${
              stg.isDone
                ? "bg-civic-green/15 text-civic-green border-civic-green/35 shadow-sm"
                : "bg-surface-base text-text-muted border-border-subtle opacity-60"
            }`}
          >
            <div className="text-[9px] opacity-70 mb-0.5">0{i + 1}</div>
            <div className="truncate font-sans">{stg.label}</div>
          </div>
        ))}
      </div>

      {/* Task Metadata Strip */}
      <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-subtle space-y-1.5 text-xs">
        <div className="flex justify-between text-text-secondary text-[11px]">
          <span>Site Location:</span>
          <span className="text-white font-bold truncate max-w-xs">{incident.address}</span>
        </div>
        <div className="flex justify-between text-text-secondary text-[11px]">
          <span>Lifecycle Status:</span>
          <span className="text-civic-cyan font-bold uppercase">{incident.status.replace(/_/g, " ")}</span>
        </div>
      </div>

    </section>
  );
}

export default TaskProgressionHUD;
