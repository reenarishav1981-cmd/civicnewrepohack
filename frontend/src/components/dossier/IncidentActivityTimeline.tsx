import React from "react";
import { Incident } from "@/types";
import { Clock, CheckCircle2, Truck, Sparkles, Radio, AlertTriangle } from "lucide-react";

interface IncidentActivityTimelineProps {
  incident: Incident;
  className?: string;
}

export function IncidentActivityTimeline({ incident, className = "" }: IncidentActivityTimelineProps) {
  const timelineEvents = incident.timeline || [];

  const getEventIcon = (type?: string) => {
    switch (type) {
      case "signal_received":
        return <Radio className="w-3.5 h-3.5 text-civic-cyan" />;
      case "ai_correlated":
        return <Sparkles className="w-3.5 h-3.5 text-civic-cyan" />;
      case "priority_escalated":
        return <AlertTriangle className="w-3.5 h-3.5 text-civic-red" />;
      case "team_assigned":
      case "worker_arrived":
      case "work_started":
        return <Truck className="w-3.5 h-3.5 text-civic-blue" />;
      case "evidence_uploaded":
      case "resolved":
        return <CheckCircle2 className="w-3.5 h-3.5 text-civic-green" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-text-muted" />;
    }
  };

  return (
    <section className={`card-quiet p-6 sm:p-7 space-y-5 font-mono-data ${className}`} aria-label="Incident Chronological Audit Ledger">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border-subtle text-xs">
        <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider">
          <Clock className="w-4 h-4 text-civic-cyan" />
          <span>Chronological Audit Trail &bull; Immutable Ledger</span>
        </div>
        <span className="text-[10px] text-text-muted">{timelineEvents.length} Events Logged</span>
      </div>

      {/* Events List */}
      {timelineEvents.length > 0 ? (
        <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10 text-xs">
          {timelineEvents.map((ev) => (
            <div key={ev.id} className="relative pl-7 space-y-1">
              <span className="absolute left-2 top-1.5 w-2.5 h-2.5 rounded-full bg-surface-base border-2 border-civic-cyan ring-2 ring-void" />
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white font-sans">{ev.title}</span>
                <span className="text-[10.5px] text-text-muted">{ev.time}</span>
              </div>
              <p className="text-[11px] text-text-secondary font-sans leading-relaxed">
                {ev.description}
              </p>
              {ev.actor && (
                <div className="text-[10px] text-text-muted font-sans">
                  Actor: <span className="text-civic-cyan">{ev.actor}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center text-xs text-text-muted font-sans">
          No operational events have been recorded yet for this incident.
        </div>
      )}

    </section>
  );
}

export default IncidentActivityTimeline;
