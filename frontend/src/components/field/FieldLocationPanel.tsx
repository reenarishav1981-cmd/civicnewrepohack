import React from "react";
import { FieldTask } from "@/types";
import { MapPin, Navigation, Crosshair } from "lucide-react";

interface FieldLocationPanelProps {
  task: FieldTask;
  className?: string;
}

export function FieldLocationPanel({ task, className = "" }: FieldLocationPanelProps) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${task.latitude},${task.longitude}`;

  return (
    <div className={`card-quiet p-5 sm:p-6 space-y-3.5 font-mono-data text-xs ${className}`} aria-label="Field Site Location">
      <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
        <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider">
          <MapPin className="w-4 h-4 text-civic-cyan" />
          <span>Work Site Location</span>
        </div>
        <span className="text-[10px] text-text-muted">GPS Anchor</span>
      </div>

      <div className="space-y-1 font-sans">
        <div className="text-white font-bold text-xs">{task.siteAddress}</div>
        <div className="text-[11px] text-text-muted font-mono-data">
          Coordinates: {task.latitude.toFixed(4)}° N, {task.longitude.toFixed(4)}° E
        </div>
      </div>

      <div className="pt-1 flex items-center justify-between">
        <span className="text-[11px] text-text-secondary font-sans">
          Estimated distance: <strong className="text-white font-mono-data">{task.distanceKm || "1.2"} km</strong>
        </span>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary py-1.5 px-3 text-xs font-bold flex items-center gap-1.5 font-sans"
        >
          <Navigation className="w-3.5 h-3.5 text-civic-cyan" />
          <span>Open in Google Maps</span>
        </a>
      </div>
    </div>
  );
}

export default FieldLocationPanel;
