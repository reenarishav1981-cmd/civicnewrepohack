import React from "react";
import { FieldTask, Incident } from "@/types";
import { TelemetryBadge } from "@/components/foundation/TelemetryBadge";
import { MapPin, Navigation, HardHat, Clock, AlertTriangle } from "lucide-react";

interface ActiveTaskCommandCardProps {
  task: FieldTask;
  incident?: Incident | null;
  onQuickNavigate?: () => void;
  className?: string;
}

export function ActiveTaskCommandCard({
  task,
  incident,
  onQuickNavigate,
  className = "",
}: ActiveTaskCommandCardProps) {
  const isCritical = task.priority === "critical";

  return (
    <div 
      className={`card-focal p-5 sm:p-6 space-y-4 font-mono-data text-xs select-none ${className}`}
      aria-label="Active Field Task"
    >
      {/* Top Bar: Task ID, Priority, Status */}
      <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-civic-cyan tracking-wider">
            {task.id}
          </span>
          <TelemetryBadge status={task.priority} />
          <TelemetryBadge status={task.status} />
        </div>
        <span className="text-[10.5px] text-text-muted">
          Active Directive
        </span>
      </div>

      {/* Incident Title & Category */}
      <div className="space-y-1.5 font-sans">
        <span className="badge-neutral text-[10px] uppercase font-mono-data">
          {incident ? incident.category : "Civic Hazard"} &bull; Linked {task.incidentId}
        </span>
        <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">
          {incident ? incident.title : `Field Repair Directive: ${task.incidentId}`}
        </h2>
      </div>

      {/* Location Bar with External Maps Link */}
      <div className="p-3 rounded-xl bg-surface-base border border-border-subtle flex items-center justify-between gap-2 font-sans">
        <div className="flex items-center gap-2 truncate min-w-0">
          <MapPin className="w-4 h-4 text-civic-cyan shrink-0" />
          <span className="text-xs text-white truncate font-medium">
            {task.siteAddress}
          </span>
        </div>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${task.latitude},${task.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary py-1 px-2.5 text-[11px] font-bold font-mono-data shrink-0 flex items-center gap-1"
        >
          <Navigation className="w-3 h-3 text-civic-cyan" />
          <span className="hidden sm:inline">Maps</span>
        </a>
      </div>

      {/* Assigned Directives Snippet */}
      {task.instructions && (
        <div className="p-3 rounded-xl bg-surface-elevated border border-border-subtle text-[11px] text-text-secondary font-sans leading-relaxed">
          <strong className="text-white block text-[10px] uppercase font-mono-data mb-0.5">Command Directives:</strong>
          &quot;{task.instructions}&quot;
        </div>
      )}
    </div>
  );
}

export default ActiveTaskCommandCard;
