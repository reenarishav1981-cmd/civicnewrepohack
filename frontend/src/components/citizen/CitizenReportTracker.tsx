import React from "react";
import Link from "next/link";
import { CitizenReport } from "@/types";
import { MapPin, Clock, ArrowRight, Radio } from "lucide-react";
import { TelemetryBadge } from "@/components/foundation/TelemetryBadge";

interface CitizenReportTrackerProps {
  reports: CitizenReport[];
  isLoading: boolean;
  className?: string;
}

export function CitizenReportTracker({
  reports,
  isLoading,
  className = "",
}: CitizenReportTrackerProps) {
  if (isLoading) {
    return (
      <div className={`p-8 text-center text-xs text-text-muted font-mono-data space-y-2 ${className}`}>
        <Radio className="w-5 h-5 animate-spin mx-auto text-civic-cyan" />
        <p>Loading recent community reports...</p>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className={`p-8 text-center text-xs text-text-muted font-sans border border-dashed border-border-subtle rounded-xl ${className}`}>
        No citizen reports found in the active database.
      </div>
    );
  }

  return (
    <div className={`space-y-3 font-sans ${className}`} aria-label="Community reports feed">
      <div className="flex items-center justify-between font-mono-data text-xs pb-2 border-b border-border-subtle">
        <span className="font-bold text-white uppercase tracking-wider">
          Community Observations Feed
        </span>
        <span className="badge-neutral text-[10px]">{reports.length} Total</span>
      </div>

      <div className="space-y-2.5">
        {reports.map((rep) => (
          <div
            key={rep.id}
            className="p-4 rounded-xl bg-surface-base border border-border-subtle hover:bg-surface-elevated transition-colors text-left space-y-2"
          >
            <div className="flex items-center justify-between text-xs font-mono-data">
              <span className="font-bold text-civic-cyan">{rep.id}</span>
              <TelemetryBadge status={rep.status} />
            </div>

            <p className="text-xs text-text-primary leading-snug">
              &quot;{rep.description}&quot;
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-text-secondary pt-1 border-t border-border-subtle">
              <span className="flex items-center gap-1 truncate max-w-xs">
                <MapPin className="w-3.5 h-3.5 text-civic-cyan shrink-0" />
                <span className="truncate">{rep.address}</span>
              </span>

              {rep.incidentId ? (
                <Link
                  href={`/track/${rep.incidentId}`}
                  className="text-civic-cyan hover:underline font-mono-data text-[10.5px] flex items-center gap-1 font-bold"
                >
                  <span>Track {rep.incidentId}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              ) : (
                <span className="text-text-muted font-mono-data text-[10.5px]">Standalone Signal</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CitizenReportTracker;
