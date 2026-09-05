import React from "react";
import { Activity, Radio, Sparkles, AlertTriangle, Truck, CheckCircle2 } from "lucide-react";

export interface ActivityItem {
  id: string;
  time: string;
  type: string;
  title: string;
  description: string;
  actor?: string;
  incidentId?: string;
}

interface LiveActivityTickerProps {
  activities: ActivityItem[];
  onSelectIncident?: (incidentId: string) => void;
  className?: string;
}

export function LiveActivityTicker({
  activities,
  onSelectIncident,
  className = "",
}: LiveActivityTickerProps) {
  const latestActivity = activities && activities.length > 0 ? activities[0] : null;

  const getActivityIcon = (type?: string) => {
    switch (type) {
      case "SIGNAL_RECEIVED":
        return <Radio className="w-3.5 h-3.5 text-civic-cyan shrink-0" />;
      case "SIGNAL_CORRELATED":
        return <Sparkles className="w-3.5 h-3.5 text-civic-cyan shrink-0" />;
      case "PRIORITY_ESCALATED":
        return <AlertTriangle className="w-3.5 h-3.5 text-civic-red shrink-0" />;
      case "TEAM_ASSIGNED":
      case "WORK_STARTED":
        return <Truck className="w-3.5 h-3.5 text-civic-blue shrink-0" />;
      case "RESOLVED":
        return <CheckCircle2 className="w-3.5 h-3.5 text-civic-green shrink-0" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-text-secondary shrink-0" />;
    }
  };

  return (
    <footer 
      className={`h-10 bg-surface-base border-t border-border-subtle px-4 flex items-center justify-between gap-4 font-mono-data text-xs select-none ${className}`}
      aria-label="Live Activity Telemetry Feed"
    >
      {/* Left: Live Activity Indicator */}
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="flex items-center gap-1.5 shrink-0 text-text-muted text-[10px] uppercase font-bold tracking-wider">
          <span className="w-2 h-2 rounded-full bg-civic-green animate-pulse" aria-hidden="true" />
          <span>Operational Feed:</span>
        </div>

        {latestActivity ? (
          <div
            onClick={() => {
              if (latestActivity.incidentId && onSelectIncident) {
                onSelectIncident(latestActivity.incidentId);
              }
            }}
            className={`flex items-center gap-2 truncate text-xs transition-colors ${
              latestActivity.incidentId
                ? "cursor-pointer hover:text-civic-cyan"
                : "text-text-secondary"
            }`}
          >
            {getActivityIcon(latestActivity.type)}
            <span className="text-text-muted font-bold text-[10px]">{latestActivity.time}</span>
            <span className="font-bold text-white truncate max-w-[200px] sm:max-w-xs">{latestActivity.title}</span>
            <span className="text-text-secondary hidden md:inline truncate max-w-lg font-sans text-[11px]">
              &bull; {latestActivity.description}
            </span>
            {latestActivity.incidentId && (
              <span className="badge-intelligence text-[9px] py-0 px-1 shrink-0 font-bold hidden lg:inline">
                Focus {latestActivity.incidentId}
              </span>
            )}
          </div>
        ) : (
          <span className="text-text-muted text-xs">Awaiting telemetry events...</span>
        )}
      </div>

      {/* Right: City Synchronized Status */}
      <div className="hidden sm:flex items-center gap-2 text-text-muted text-[10px] uppercase font-bold shrink-0">
        <span>SECTOR 3 CORRIDOR</span>
        <span className="text-border-medium">&bull;</span>
        <span className="text-civic-cyan">AI MESH ACTIVE</span>
      </div>
    </footer>
  );
}

export default LiveActivityTicker;
