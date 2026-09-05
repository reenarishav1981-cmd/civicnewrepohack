import React from "react";
import { Incident } from "@/types";
import { ShieldAlert, Users, Sparkles, AlertTriangle, Layers } from "lucide-react";

interface IncidentFieldBriefingProps {
  incident?: Incident | null;
  className?: string;
}

export function IncidentFieldBriefing({ incident, className = "" }: IncidentFieldBriefingProps) {
  if (!incident) return null;

  return (
    <div className={`card-quiet p-5 sm:p-6 space-y-4 font-mono-data text-xs ${className}`} aria-label="Incident Field Briefing">
      <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider">
          <ShieldAlert className="w-4 h-4 text-civic-cyan" />
          <span>Incident Operational Briefing</span>
        </div>
        <span className="text-civic-cyan font-bold">{incident.id}</span>
      </div>

      <div className="space-y-2 font-sans">
        <h3 className="text-base font-bold text-white leading-tight">
          {incident.title}
        </h3>
        <p className="text-xs text-text-secondary leading-relaxed">
          {incident.priorityReason || "High priority civic work order dispatched from municipal operations command."}
        </p>
      </div>

      {/* Structured Telemetry Strip */}
      <div className="grid grid-cols-3 gap-2 text-center pt-1 font-mono-data">
        <div className="p-2.5 rounded-lg bg-surface-base border border-border-subtle space-y-0.5">
          <div className="text-[9px] text-text-muted uppercase font-bold">Priority</div>
          <div className="text-sm font-bold text-civic-red">{incident.priorityScore}/100</div>
        </div>
        <div className="p-2.5 rounded-lg bg-surface-base border border-border-subtle space-y-0.5">
          <div className="text-[9px] text-text-muted uppercase font-bold">Signals</div>
          <div className="text-sm font-bold text-civic-cyan">{incident.connectedReportsCount} Reports</div>
        </div>
        <div className="p-2.5 rounded-lg bg-surface-base border border-border-subtle space-y-0.5">
          <div className="text-[9px] text-text-muted uppercase font-bold">Impact</div>
          <div className="text-sm font-bold text-white">~{incident.affectedCitizenEstimate?.toLocaleString() || "1,200"}</div>
        </div>
      </div>
    </div>
  );
}

export default IncidentFieldBriefing;
