import React from "react";
import { Incident } from "@/types";
import { TelemetryBadge } from "@/components/foundation/TelemetryBadge";
import { MapPin, Clock } from "lucide-react";

interface SituationSummaryProps {
  incident: Incident;
  className?: string;
}

export function SituationSummary({ incident, className = "" }: SituationSummaryProps) {
  const isCritical = incident.priorityScore >= 80;
  const isHigh = incident.priorityScore >= 55 && incident.priorityScore < 80;
  const isResolved = incident.status === "resolved" || incident.status === "closed";

  const formattedDate = incident.createdAt 
    ? new Date(incident.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
      })
    : "Recent";

  return (
    <section className={`card-quiet p-5 sm:p-6 space-y-5 font-mono-data ${className}`} aria-label="Incident Situation Summary">
      
      {/* Top Meta: ID, Category, Priority, Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border-subtle">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-sm font-bold text-civic-cyan tracking-wider">
            {incident.id}
          </span>
          <TelemetryBadge status={incident.priority} value={`${incident.priorityScore}/100`} />
          <TelemetryBadge status={incident.status} />
          <span className="badge-neutral text-[10px] font-sans font-bold">
            {incident.category}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-text-muted font-sans">
          <Clock className="w-3.5 h-3.5 text-civic-amber" />
          <span>Reported {formattedDate}</span>
        </div>
      </div>

      {/* Title & Core Situation */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans leading-tight">
          {incident.title}
        </h1>
        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-text-secondary font-sans">
          <span className="flex items-center gap-1.5 text-white font-medium">
            <MapPin className="w-4 h-4 text-civic-cyan shrink-0" />
            <span>{incident.address}</span>
          </span>
          {incident.zone && (
            <>
              <span className="text-text-muted">&bull;</span>
              <span className="text-text-muted font-mono-data text-[11px]">{incident.zone}</span>
            </>
          )}
        </div>
      </div>

      {/* 4-Item Horizontal Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
        
        {/* Priority Score */}
        <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-subtle space-y-0.5">
          <div className="text-[10px] text-text-muted uppercase font-bold">Priority Score</div>
          <div className="text-2xl font-bold flex items-baseline gap-1">
            <span className={isCritical ? "text-civic-red" : isHigh ? "text-civic-amber" : isResolved ? "text-civic-green" : "text-civic-cyan"}>
              {incident.priorityScore}
            </span>
            <span className="text-xs text-text-muted font-normal">/100</span>
          </div>
        </div>

        {/* AI Correlation Confidence */}
        <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-subtle space-y-0.5">
          <div className="text-[10px] text-text-muted uppercase font-bold">Correlation Confidence</div>
          <div className="text-2xl font-bold text-civic-cyan">
            {Math.round(incident.aiConfidence * 100)}%
          </div>
        </div>

        {/* Connected Citizen Reports */}
        <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-subtle space-y-0.5">
          <div className="text-[10px] text-text-muted uppercase font-bold">Signals Clustered</div>
          <div className="text-2xl font-bold text-white flex items-baseline gap-1">
            <span>{incident.connectedReportsCount}</span>
            <span className="text-xs text-text-muted font-normal">Signals</span>
          </div>
        </div>

        {/* Impact Footprint */}
        <div className="p-3.5 rounded-xl bg-surface-elevated border border-border-subtle space-y-0.5">
          <div className="text-[10px] text-text-muted uppercase font-bold">Estimated Impact</div>
          <div className="text-2xl font-bold text-white flex items-baseline gap-1">
            <span>
              {incident.affectedCitizenEstimate 
                ? `~${incident.affectedCitizenEstimate.toLocaleString()}` 
                : "Active Area"}
            </span>
            <span className="text-xs text-text-muted font-normal">
              {incident.affectedCitizenEstimate ? "Citizens" : ""}
            </span>
          </div>
        </div>

      </div>

    </section>
  );
}

export default SituationSummary;
